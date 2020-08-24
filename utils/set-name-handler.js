'use strict';

const config = require('../config');
const HttpWrapper = require('../utils/http-wrapper');
const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const helpers = require('../helpers/');

class SetNameHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.newName = '';
        this.oldName = '';
        this.args = [];

        this.authHandler = authHandler;
    }

    setArgs(args) {

        this.args = args;
    }

    getResult() {

        return this.result;
    }

    async askForNewProjectName() {

        if (this.args.length > 0) {

            this.newName = this.args[0];

            return;
        }

        this.newName = await helpers.showTextPrompt('Enter new project name', 'Project name must not be empty.');
    }

    setName() {

        return new Promise((resolve, reject) => {

            const fileName = 'package.json';

            helpers.deserializeJsonFile(fileName).then(fileContent => {

                this.oldName = fileContent.name;

                if (this.newName === this.oldName) {

                    reject([{ 'Status': CliStatus.SUCCESS, 'Message': 'Project names are the same.' }]);
                }

                fileContent.name = this.newName;

                helpers.serializeJsonFile(fileName, fileContent).then(() => {

                    this.result = [{ 'Status': CliStatus.SUCCESS, 'Message': `Project name has been successfully changed from ${this.oldName} to ${this.newName}.` }];
                    resolve();

                }).catch(e => {

                    console.log(e);
                    reject([{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with saving ${fileName}` }]);
                });

            }).catch(e => {

                console.log(e);
                reject([{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with reading ${fileName}` }]);
            });
        });
    }

    removeProject() {

        const options = {
            method: 'DELETE',
            port: config.port,
            hostname: config.host,
            path: `/project/unpublish/${this.oldName}`,
            headers: this.authHandler.headers
        };

        const http = new HttpWrapper(options);

        return http.delete();
    }
}

module.exports = SetNameHandler;
