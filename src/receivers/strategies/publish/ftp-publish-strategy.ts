'use strict';

import path from "path";
import fs from "fs";
import fse from "fs-extra";
import Ora from "ora";
import { OutgoingHttpHeaders } from "http";
import HttpWrapper, { CustomOkResponse } from "../../../utils/http-wrapper";
import { MdbGoPackageJson, OutputColor } from "../../../models";
import CommandResult from "../../../utils/command-result";
import Context from "../../../context";
import config from "../../../config";
import helpers from "../../../helpers";

class FtpPublishStrategy {

    private readonly userToken;
    private readonly cwd = process.cwd();
    private readonly context;

    private packageJsonConfig!: MdbGoPackageJson;
    private result;
    private flags;
    private metaData!: { [key: string]: string };
    private sent = '0';

    constructor(context: Context, result: CommandResult) {

        this.userToken = context.userToken;
        this.context = context;
        this.result = result;

        this.flags = context.getParsedFlags();

        this._loadMetaData(context);
    }

    async publish() {

        this._loadMetaData(this.context);

        return this.buildProject()
            .then(() => this.uploadFiles());
    }

    _loadMetaData(context: Context): void {
        this.packageJsonConfig = context.packageJsonConfig;
        this.metaData = {
            packageName: context.mdbConfig.getValue('meta.starter') || '',
            projectName: this.packageJsonConfig.name || context.mdbConfig.getValue('projectName') || '',
            starter: this.flags.variant as string || context.mdbConfig.getValue('meta.starter') || '',
            domain: this.packageJsonConfig.domainName || context.mdbConfig.getValue('domain') || '',
            platform: context.mdbConfig.getValue('backend.platform') || '',
            hash: context.mdbConfig.getValue('hash') || ''
        };
    }

    async buildProject() {

        let result = '';

        const distPath = path.join(this.cwd, 'dist');
        const buildPath = path.join(this.cwd, 'build');
        let packageJson = this.packageJsonConfig;

        if (!packageJson.scripts || !packageJson.scripts.build) {
            return;
        }

        const isAngular = packageJson.dependencies && !!packageJson.dependencies['@angular/core'];
        const isReact = packageJson.dependencies && !!packageJson.dependencies.react;
        const isVue = packageJson.dependencies && !!packageJson.dependencies.vue;

        if (isAngular) {

            const angularJsonPath = path.join(this.cwd, 'angular.json');
            const angularJson = await helpers.deserializeJsonFile(angularJsonPath);

            result = await this.runBuildScript();

            const angularFolder = path.join('dist', angularJson.defaultProject);
            const indexPath = path.join(this.cwd, angularFolder, 'index.html');
            let indexHtml = fs.readFileSync(indexPath, 'utf8');
            indexHtml = indexHtml.replace(/<base href="\/">/g, '<base href=".">');
            fs.writeFileSync(indexPath, indexHtml, 'utf8');

            const toRename = path.join(this.cwd, angularFolder);

            fse.moveSync(toRename, buildPath, { overwrite: true });
            fse.moveSync(buildPath, distPath, { overwrite: true });

        } else if (isReact) {

            const appJsPath = path.join(this.cwd, 'src', 'App.js');

            if (fs.existsSync(appJsPath)) {

                let appJsFile = fs.readFileSync(appJsPath, 'utf8');
                appJsFile = appJsFile.replace(/<Router/g, `<Router basename='/dist'`);
                fs.writeFileSync(appJsPath, appJsFile, 'utf8');
            }

            packageJson.homepage = `https://${this.metaData.domain}/dist/`;
            await helpers.serializeJsonFile('package.json', packageJson);

            result = await this.runBuildScript();

            if (fs.existsSync(appJsPath)) {

                let appJsFile = fs.readFileSync(appJsPath, 'utf8');
                const regex = new RegExp(`<Router basename='/dist'`, 'g');
                appJsFile = appJsFile.replace(regex, '<Router');
                fs.writeFileSync(appJsPath, appJsFile, 'utf8');
            }

            delete packageJson.homepage;
            await helpers.serializeJsonFile('package.json', packageJson);

            if (fs.existsSync(buildPath)) {

                fse.moveSync(buildPath, distPath, { overwrite: true });
            }

        } else if (isVue) {

            const vueConfigFile = path.join(this.cwd, 'vue.config.js');

            if (!fs.existsSync(vueConfigFile)) {

                const vueConfigContent = 'module.exports = { publicPath: \'.\' }';

                fs.writeFileSync(vueConfigFile, vueConfigContent, 'utf8');
            }

            result = await this.runBuildScript();

        } else {

            result = await this.runBuildScript();

            this.result.addAlert(
                OutputColor.Yellow,
                'Warning',
                'This is not MDB JARV project and there is no guarantee that it will work properly after publishing. In case of problems, please write to our support https://mdbootstrap.com/support/.'
            );

            if (!fs.existsSync(distPath) && !fs.existsSync(buildPath)) {
                throw new Error('Build folder not found.');
            }
        }

        this.result.addAlert(OutputColor.Green, 'Success', result);
    }

    async runBuildScript(directoryPath = this.cwd) {
        await this.context.loadPackageManager();
        return this.context.packageManager!.build(directoryPath);
    }

    uploadFiles() {

        const spinner = Ora({ text: 'Uploading files' });
        spinner.start();

        return new Promise<CustomOkResponse>((resolve, reject) => {

            const headers: OutgoingHttpHeaders = {
                'Authorization': `Bearer ${this.userToken}`
            };

            if (this.context.entity === 'backend') headers['x-mdb-cli-backend-technology'] = this.flags.platform as string || this.metaData.platform as string;
            if (this.context.entity === 'wordpress') headers['x-mdb-cli-wp-page'] = this.metaData.starter;
            headers['x-mdb-cli-project-name'] = this.metaData.projectName;
            headers['x-mdb-cli-package-name'] = this.metaData.packageName;
            headers['x-mdb-cli-domain-name'] = this.metaData.domain;
            headers['x-mdb-cli-dot-mdb-hash'] = this.metaData.hash;
            headers['x-mdb-cli-override'] = this.flags.override ? 'true' : '';

            const archive = helpers.archiveProject('zip', { zlib: { level: 9 } });
            const http = new HttpWrapper();
            const request = http.createRequest({
                hostname: config.host,
                path: '/project/publish',
                method: 'POST',
                headers
            }, (err, response) => {

                if (err) {
                    spinner.stop();
                    return reject({ message: err.message, statusCode: err.statusCode });
                }

                this.convertToMb(archive.pointer());

                spinner.succeed(`Uploading files | ${this.sent} Mb`);

                if (response!.statusCode >= 200 && response!.statusCode <= 299) {
                    this.result.addTextLine(`Sent ${this.sent} Mb`);
                }

                resolve(response as CustomOkResponse);
            });

            archive.on('error', reject);
            archive.on('warning', (warn) => this.result.addAlert(OutputColor.Yellow, 'Warning', warn.data));
            archive.on('progress', () => {
                this.convertToMb(archive.pointer());
                spinner.text = `Uploading files | ${this.sent} Mb`;
            });

            archive.pipe(request);

            archive.glob('**', {
                cwd: this.cwd,
                ignore: ['node_modules/**', '.git/**', '.gitignore', 'Dockerfile', '.dockerignore', '.idea/**'],
                dot: true
            });
            archive.finalize();
        });
    }

    convertToMb(pointer: number) {

        const num = pointer / Math.pow(1024, 2);
        this.sent = num.toFixed(3);
    }
}

export default FtpPublishStrategy;
