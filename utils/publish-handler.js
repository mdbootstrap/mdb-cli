'use strict';

const fs = require('fs');
const Ora = require('ora');
const path = require('path');
const atob = require('atob');

const config = require('../config');
const helpers = require('../helpers');
const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const HttpWrapper = require('../utils/http-wrapper');

class PublishHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.cwd = process.cwd();
        this.projectName = '';
        this.packageName = '';
        this.domainName = '';
        this.last = 0;
        this.sent = 0;
        this.endMsg = '';

        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/project/publish',
            method: 'POST'
        };

        this.authHandler = authHandler;

        this.setAuthHeader();
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.options.headers = this.authHandler.headers;
    }

    getResult() {

        return this.result;
    }

    async setProjectName() {

        const packageJsonPath = path.join(this.cwd, 'package.json');

        try {

            const packageJson = await helpers.deserializeJsonFile(packageJsonPath);
            this.projectName = packageJson.name;
            this.domainName = packageJson.domainName || '';

            return Promise.resolve();

        } catch (e) {

            if (e.code && e.code === 'ENOENT') {

                return this.handleMissingPackageJson();
            }

            this.result = [{ Status: CliStatus.INTERNAL_SERVER_ERROR, Message: `Problem with reading project name: ${e}` }];
            return Promise.reject(this.result);
        }
    }

    async setPackageName() {

        const metadataPath = path.join(this.cwd, '.mdb');

        try {

            const projectMetadata = await helpers.deserializeJsonFile(metadataPath);
            this.packageName = projectMetadata.packageName || '';

        } catch (e) {

            this.packageName = '';
        }

        return Promise.resolve();
    }

    async buildProject() {

        const packageJsonPath = path.join(this.cwd, 'package.json');
        let packageJson = await helpers.deserializeJsonFile(packageJsonPath);

        if (packageJson.scripts && packageJson.scripts.build) {

            const isAngular = !!packageJson.dependencies['@angular/core'];
            const isReact = !!packageJson.dependencies.react;
            const isVue = !!packageJson.dependencies.vue;

            if (isAngular) {

                const angularJsonPath = path.join(this.cwd, 'angular.json');
                const angularJson = await helpers.deserializeJsonFile(angularJsonPath);
                const angularFolder = path.join('dist', angularJson.defaultProject);

                await helpers.buildProject();

                this.cwd = path.join(this.cwd, angularFolder);

                const indexPath = path.join(this.cwd, 'index.html');
                let indexHtml = fs.readFileSync(indexPath, 'utf8');
                indexHtml = indexHtml.replace(/<base href="\/">/g, '<base href=".">');
                fs.writeFileSync(indexPath, indexHtml, 'utf8');

            } else if (isReact) {

                const token = this.authHandler.headers.Authorization;
                const [, jwtBody] = token.split('.');
                const username = JSON.parse(atob(jwtBody)).name;

                const appJsPath = path.join(this.cwd, 'src', 'App.js');
                let appJsFile = fs.readFileSync(appJsPath, 'utf8');
                appJsFile = appJsFile.replace(/<Router/g, `<Router basename='/projects/${username}/${packageJson.name}'`);
                fs.writeFileSync(appJsPath, appJsFile, 'utf8');

                packageJson.homepage = `https://mdbootstrap.com/projects/${username}/${packageJson.name}/`;
                await helpers.serializeJsonFile('package.json', packageJson);

                await helpers.buildProject();

                appJsFile = fs.readFileSync(appJsPath, 'utf8');
                const regex = new RegExp(`<Router basename='/projects/${username}/${packageJson.name}'`, 'g');
                appJsFile = appJsFile.replace(regex, '<Router');
                fs.writeFileSync(appJsPath, appJsFile, 'utf8');

                packageJson = await helpers.deserializeJsonFile(packageJsonPath);
                delete packageJson.homepage;
                await helpers.serializeJsonFile('package.json', packageJson);

                this.cwd = path.join(this.cwd, 'build');

            } else if (isVue) {

                const vueConfigFile = path.join(this.cwd, 'vue.config.js');

                if (!fs.existsSync(vueConfigFile)) {

                    const vueConfigContent = 'module.exports = { publicPath: \'.\' }';

                    fs.writeFileSync(vueConfigFile, vueConfigContent, 'utf8');
                }

                await helpers.buildProject();

                this.cwd = path.join(this.cwd, 'dist');
            }
        }

        return Promise.resolve();
    }

    publish() {

        console.log('Publishing...');

        const spinner = new Ora({
            text: 'Uploading files'
        });

        spinner.start();

        return new Promise((resolve, reject) => {

            this.options.headers['x-mdb-cli-project-name'] = this.projectName;
            this.options.headers['x-mdb-cli-package-name'] = this.packageName;
            this.options.headers['x-mdb-cli-domain-name'] = this.domainName;
            const { archiveProject } = require('../helpers/archiver-wrapper');
            const archive = archiveProject('zip', { zlib: { level: 9 } });
            const http = new HttpWrapper(this.options);

            const request = http.createRequest(response => {

                response.on('data', (data) => {

                    this.endMsg = Buffer.from(data).toString('utf8');
                });

                response.on('end', () => {

                    this.convertToMb(archive.pointer());

                    spinner.succeed(`Uploading files | ${this.sent} Mb`);

                    this.result.push({ 'Status': response.statusCode, 'Message': this.endMsg });

                    if (response.statusCode === CliStatus.HTTP_SUCCESS) {

                        this.result.push({ 'Status': CliStatus.SUCCESS, 'Message': `Sent ${this.sent} Mb` });
                    } else {

                        this.result.push({ 'Status': response.statusCode, 'Message': response.statusMessage });
                    }

                    resolve();
                });

                response.on('error', console.error);
            });

            archive.on('error', reject);

            archive.on('warning', console.warn);

            archive.on('progress', () => {

                this.convertToMb(archive.pointer());

                spinner.text = `Uploading files | ${this.sent} Mb`;
            });

            archive.pipe(request);

            archive.directory(this.cwd, this.projectName);

            archive.finalize();
        });
    }

    convertToMb(pointer) {

        const num = pointer / Math.pow(1024, 2);
        this.sent = num.toFixed(3);
    }

    handleMissingPackageJson() {

        return helpers.createPackageJson(this.cwd)
            .then(msg => this.result.push(msg))
            .then(() => this.setProjectName())
            .catch(err => {

                this.result.push(err);
                this.result.push({ 'Status': CliStatus.ERROR, 'Message': 'Missing package.json file.' });

                console.table(this.result);
                process.exit(1);
            });
    }
}

module.exports = PublishHandler;
