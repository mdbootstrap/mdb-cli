'use strict';

const AuthHandler = require('./auth-handler');
const path = require('path');
const archiver = require('archiver');
const Ora = require('ora');

const HttpWrapper = require('../utils/http-wrapper');

const config = require('../config');

class PublishHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.cwd = process.cwd();
        this.projectName = '';
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
    };

    async setProjectName() {

        try {

            const { deserializeJsonFile } = require('../helpers/deserialize-object-from-file');
            const packageJsonPath = path.join(this.cwd, 'package.json');
            const packageJson = await deserializeJsonFile(packageJsonPath);

            this.projectName = packageJson.name;

            if (packageJson.scripts.build) {
                const { buildProject } = require('./../helpers/build-project');
                await buildProject();
                this.cwd = path.join(this.cwd, 'dist');
            }

            return Promise.resolve();

        } catch (e) {

            const { createPackageJson } = require('../helpers/create-package-json');

            return createPackageJson()
                .then((created) => {

                        if (created) {

                            this.result = [{ 'Status': code, 'Message': 'package.json file created. Publishing...' }];

                            console.table(this.result);
                            this.setProjectName();
                        } else {

                            return Promise.resolve();
                        }
                    },
                    error => {

                        this.result = [{ 'Status': 'error', 'Message': 'Missing package.json file.' }];

                        console.log(error);
                        console.table(this.result);

                        process.exit(1);
                })
                .catch(console.error);
        }
    }

    publish() {

        console.log('Publishing...');

        const spinner = new Ora({
            text: 'Uploading files'
        });

        spinner.start();

        return new Promise((resolve, reject) => {

            this.options.headers['x-mdb-cli-project-name'] = this.projectName;
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

}

module.exports = PublishHandler;
