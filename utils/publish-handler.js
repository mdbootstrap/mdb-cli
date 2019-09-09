'use strict';

const AuthHandler = require('./auth-handler');
const archiver = require('archiver');
const config = require('../config');
const helpers = require('../helpers');
const HttpWrapper = require('../utils/http-wrapper');
const Ora = require('ora');
const path = require('path');

class PublishHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.cwd = process.cwd();
        this.projectName = '';
        this.packageName = '';
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

        try {

            const packageJsonPath = path.join(this.cwd, 'package.json');
            const metadataPath = path.join(this.cwd, '.mdb');
            const packageJson = await helpers.deserializeJsonFile(packageJsonPath);
            const projectMetadata = await helpers.deserializeJsonFile(metadataPath).catch(error => console.log(`Problem with reading project metadata:\n${error}`));

            this.projectName = packageJson.name;
            this.packageName = projectMetadata.packageName || '';

            return Promise.resolve();

        } catch (e) {

            if (e.code && e.code === 'ENOENT') {

                return this.handleMissingPackageJson();
            }

            throw e;
        }
    }

    async buildProject() {

        const fs = require('fs');

        const appVuePath = path.join(process.cwd(), 'src', 'App.vue');
        const isVue = fs.existsSync(appVuePath);

        const angularJsonPath = path.join(process.cwd(), 'angular.json');
        const isAngular = fs.existsSync(angularJsonPath);

        const angularFolder = path.join('dist', 'angular-bootstrap-md-app');

        const { deserializeJsonFile } = require('../helpers');
        const packageJsonPath = path.join(this.cwd, 'package.json');
        const packageJson = await deserializeJsonFile(packageJsonPath);

        if (packageJson.scripts.build) {

            const { buildProject } = require('./../helpers');
            await buildProject();
            let buildFolder = isAngular ? angularFolder : isVue ? 'dist' : 'build';

            this.cwd = path.join(this.cwd, buildFolder);

            const indexHtmlPath = path.join(this.cwd, 'index.html');
            let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
            indexHtml = indexHtml.replace(/<base href="\/">/g, '<base href="./">');

            if (isVue) indexHtml = indexHtml.replace(/=\/static/g, '=./static');
            else if (!isAngular && !isVue) indexHtml = indexHtml.replace(/="\/static/g, '="./static');

            fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');

            if (!isAngular) {

                const files = fs.readdirSync(path.join(this.cwd, 'static', 'css'), { encoding: 'utf-8' });
                files.forEach(file => {

                    if (file.endsWith('.css')) {
                        const cssFilePath = path.join(this.cwd, 'static', 'css', file);
                        let cssFile = fs.readFileSync(cssFilePath, 'utf8');
                        cssFile = cssFile
                            .replace(/\/static\/fonts/g, '../fonts')
                            .replace(/\/static\/media/g, '../media');

                        fs.writeFileSync(cssFilePath, cssFile, 'utf8');
                    }
                });
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
            const http = new HttpWrapper(this.options);

            const request = http.createRequest(response => {

                response.on('data', (data) => {
                    this.endMsg = Buffer.from(data).toString('utf8');
                });

                response.on('end', () => {

                    this.convertToMb(archive.pointer());

                    spinner.succeed(`Uploading files | ${this.sent} Mb`);

                    this.result = [{ 'Status': 'published', 'Message': `Sent ${this.sent} Mb` }];

                    console.log(`\n Your application will be available under ${this.endMsg.endsWith('/') ? this.endMsg : this.endMsg + '/'} address in about 3-5 mins.\n`);

                    resolve();
                });
            });

            const archive = archiver('zip', { zlib: { level: 9 } });

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
            .then((message) => {

                this.result = [message];
                this.result.push({ 'Status': 0, 'Message': 'package.json file created. Publishing...' });

                console.table(this.result);
            }).then(() => this.setProjectName())
            .catch((err) => {

                this.result = [err];
                this.result.push({ 'Status': 'error', 'Message': 'Missing package.json file.' });

                console.table(this.result);
                process.exit(1);
            });
    }
}

module.exports = PublishHandler;
