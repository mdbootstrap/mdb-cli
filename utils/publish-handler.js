'use strict';

const AuthHandler = require('./auth-handler');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { spawn } = require('child_process');
const prompt = require('inquirer').createPromptModule();
const Ora = require('ora');

const HttpWrapper = require('../utils/http-wrapper');

const config = require('../config');

class PublishHandler {

    constructor() {

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

        this.authHandler = new AuthHandler();

        this.setAuthHeader();
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.options.headers = this.authHandler.headers;
    }

    getResult() {

        return this.result;
    };

    setProjectName() {

        try {

            let packageJson = fs.readFileSync(path.join(this.cwd, 'package.json'), { encoding: 'utf8' });
            packageJson = typeof packageJson === 'string' ? JSON.parse(packageJson) : packageJson;

            this.projectName = packageJson.name;

            return Promise.resolve();

        } catch (e) {

            return this._askCreatePackageJson()
                .then((confirmed) => {

                    if (confirmed) {

                        return this._npmInit()
                            .then(() => this.setProjectName())
                            .catch(console.error);
                    }

                    this.result = [{ 'Status': 'error', 'Message': 'Missing package.json file' }];

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

    _askCreatePackageJson() {

        return prompt([
            {
                type: 'confirm',
                name: 'createPackageJson',
                message: 'Missing package.json file. Create?',
                default: true
            }
        ])
            .then((answers) => {

                return answers.createPackageJson;
            });
    }

    _npmInit() {

        return new Promise((resolve, reject) => {

            process.stdin.setRawMode(false);

            const isWindows = process.platform === 'win32';

            const npmInit = spawn('npm', ['init'], { stdio: 'inherit', ...(isWindows && { shell: true }) });

            npmInit.on('error', console.log);
            npmInit.on('exit', (code) => {

                process.stdin.setRawMode(true);

                if (code === 0) {

                    this.result = [{ 'Status': code, 'Message': 'package.json file created. Publishing...' }];

                    console.table(this.result);

                    resolve();
                } else {

                    this.result = [{ 'Status': code, 'Message': 'There were some errors. Please try again.' }];

                    console.table(this.result);

                    reject();
                }
            });
        });
    }
}

module.exports = PublishHandler;
