'use strict';

const config = require('../config');
const AuthHandler = require('./auth-handler');
const HttpWrapper = require('../utils/http-wrapper');
const CliStatus = require('../models/cli-status');
const childProcess = require('child_process');
const helpers = require('../helpers');
const path = require('path');
const fs = require('fs');

class CreateHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.name = '';
        this.cwd = process.cwd();
        this.authHandler = authHandler;
        this.gitlabUrl = '';

        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/project/create',
            method: 'POST',
            data: '',
            headers: {
                ...this.authHandler.headers,
                'Content-Type': 'application/json'
            }
        };
    }

    getResult() {

        return this.result;
    }

    async getProjectName() {

        const fileName = 'package.json';

        await helpers.createPackageJson(null, this.cwd);

        try {
            const fileContent = await helpers.deserializeJsonFile(fileName);
            this.name = fileContent.name;
        }
        catch (err) {

            console.log(err);
            return Promise.reject([{ 'Status': CliStatus.ERROR, 'Message': `Problem with reading ${fileName}` }]);
        }
    }

    addJenkinsfile() {

        return helpers.createJenkinsfile(this.cwd);
    }

    create() {

        this.options.data = { projectName: this.name };
        const http = new HttpWrapper(this.options);

        return http.post().then(result => {

            result = typeof result === 'string' ? JSON.parse(result) : result;

            const { name, url, webhook, saved, pipeline } = result;

            this.gitlabUrl = url;

            if (webhook === false) this.result.push({ Status: CliStatus.ERROR, Message: 'Gitlab webhook not added. Please write to our support https://mdbootstrap.com/support/' });
            if (saved === false) this.result.push({ Status: CliStatus.ERROR, Message: 'Project data not saved. Please write to our support https://mdbootstrap.com/support/' });
            if (pipeline === false) this.result.push({ Status: CliStatus.ERROR, Message: 'Jenkins pipeline not created. Please write to our support https://mdbootstrap.com/support/' });

            this.result.push({ Status: CliStatus.HTTP_SUCCESS, Message: `Project ${name} successfully created. Repository url: ${url} ` });
        });
    }

    pushToGitlab() {

        const gitConfigPath = path.join(this.cwd, '.git', 'config');

        return new Promise((resolve, reject) => {

            if (fs.existsSync(gitConfigPath)) {

                childProcess.exec(`git remote set-url origin ${this.gitlabUrl} && git push -u origin master`, (err) => {
    
                    if (err && err.message && err.message.toLowerCase().indexOf('authentication failed') !== -1) {

                        console.log('\n\x1b[31m%s\x1b[0m', 'Note:', 'There were some authentication problems. Please make sure you provided correct username and password. If you are certain that the credentials are correct and still see this message, please log into your MDB Go GitLab account to activate it here: https://git.mdbgo.com/. Once you do that run the following command:\n');
                        console.log('\x1b[36m%s\x1b[0m', '\tgit push -u origin master\n\n');

                        return resolve();
                    } else if (err) {

                        return reject(err.message);
                    }

                    resolve();
                });
            } else {

                childProcess.exec(`git init && git remote add origin ${this.gitlabUrl} && git add . && git commit -m "Initial commit" && git push -u origin master`, (err) => {

                    if (err && err.message && err.message.toLowerCase().indexOf('authentication failed') !== -1) {

                        console.log('\n\x1b[31m%s\x1b[0m', 'Note:', 'There were some authentication problems. Please make sure you provided correct username and password. If you are certain that the credentials are correct and still see this message, please log into your MDB Go GitLab account to activate it here: https://git.mdbgo.com/. Once you do that run the following command:\n');
                        console.log('\x1b[36m%s\x1b[0m', '\tgit push -u origin master\n\n');

                        return resolve();
                    } else if (err) {

                        return reject(err.message);
                    }

                    resolve();
                });
            }
        });
    }
}

module.exports = CreateHandler;
