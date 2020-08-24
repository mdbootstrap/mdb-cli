'use strict';

const config = require('../config');
const AuthHandler = require('./auth-handler');
const HttpWrapper = require('../utils/http-wrapper');
const CliStatus = require('../models/cli-status');
const helpers = require('../helpers');

class CreateHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.name = '';
        this.cwd = process.cwd();
        this.authHandler = authHandler;

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

            if (webhook === false) this.result.push({ Status: CliStatus.ERROR, Message: 'Gitlab webhook not added. Please write to our support https://mdbootstrap.com/support/' });
            if (saved === false) this.result.push({ Status: CliStatus.ERROR, Message: 'Project data not saved. Please write to our support https://mdbootstrap.com/support/' });
            if (pipeline === false) this.result.push({ Status: CliStatus.ERROR, Message: 'Jenkins pipeline not created. Please write to our support https://mdbootstrap.com/support/' });

            console.log('\nRun the following commands to init repository and add remote URL\n');
            console.log('\x1b[36m%s\x1b[0m', '  git init');
            console.log('\x1b[36m%s\x1b[0m', '  git remote add origin ' + url + '\n');

            this.result.push({ Status: CliStatus.HTTP_SUCCESS, Message: `Project ${name} successfully created. Repository url: ${url}` });
        });
    }
}

module.exports = CreateHandler;
