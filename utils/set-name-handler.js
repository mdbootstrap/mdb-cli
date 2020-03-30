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

        const { deserializeJsonFile } = require('../helpers/deserialize-object-from-file');
        const fileName = 'package.json';

        return deserializeJsonFile(fileName).then(fileContent => {

            this.oldName = fileContent.name;

            if (this.newName === this.oldName) {

                this.result = [{ 'Status': CliStatus.SUCCESS, 'Message': 'Project names are the same.' }];
                return Promise.reject();
            }

            const { serializeJsonFile } = require('../helpers/serialize-object-to-file');
            fileContent.name = this.newName;

            return serializeJsonFile(fileName, fileContent).then(() => {

                this.result = [{ 'Status': CliStatus.SUCCESS, 'Message': `Project name has been successfully changed from ${this.oldName} to ${this.newName}.` }];
                return Promise.resolve();
            }, error => {

                this.result = [{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with saving ${fileName}` }];
                return Promise.reject(error);
            });
        }, error => {

            this.result = [{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with reading ${fileName}` }];
            return Promise.reject(error);
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
