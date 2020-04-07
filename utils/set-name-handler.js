'use strict';

const config = require('../config');
const HttpWrapper = require('../utils/http-wrapper');
const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');

class SetNameHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.newName = '';
        this.oldName = '';

        this.authHandler = authHandler;
    }

    getResult() {

        return this.result;
    }

    askForNewProjectName() {

        const prompt = require('inquirer').createPromptModule();

        return prompt([{
            type: 'text',
            message: 'Set new project name',
            name: 'name',
            validate: (value) => {
                /* istanbul ignore next */
                const valid = Boolean(value);
                /* istanbul ignore next */
                return valid || 'Project name must not be empty.';
            }
        }]).then((answers) => {

            this.newName = answers.name;
        });
    }

    setName() {

        return new Promise((resolve, reject) => {

            const fileName = 'package.json';

            const { deserializeJsonFile } = require('../helpers/deserialize-object-from-file');

            deserializeJsonFile(fileName).then(fileContent => {

                this.oldName = fileContent.name;

                if (this.newName === this.oldName) {

                    reject([{ 'Status': CliStatus.SUCCESS, 'Message': 'Project names are the same.' }]);
                }

                fileContent.name = this.newName;

                const { serializeJsonFile } = require('../helpers/serialize-object-to-file');

                serializeJsonFile(fileName, fileContent).then(() => {

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
