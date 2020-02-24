'use strict';

const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');

class SetDomainNameHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.name = '';

        this.authHandler = authHandler;
    }

    getResult() {

        return this.result;
    }

    askForDomainName() {

        const prompt = require('inquirer').createPromptModule();

        return prompt([
            {
                type: 'text',
                message: 'Set domain name',
                name: 'name',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value);
                    /* istanbul ignore next */
                    return valid || 'Domain name must not be empty.';
                }
            }
        ])
            .then((answers) => {

                this.name = answers.name;
            });
    }

    setDomainName() {

        const { deserializeJsonFile } = require('../helpers/deserialize-object-from-file');
        const fileName = 'package.json';

        return deserializeJsonFile(fileName).then(fileContent => {

            const { serializeJsonFile } = require('../helpers/serialize-object-to-file');
            fileContent.domainName = this.name;

            return serializeJsonFile(fileName, fileContent).then(() => {

                this.result = [{'Status': CliStatus.SUCCESS, 'Message': `Domain name has been changed to ${this.name} successfully`}];
                return Promise.resolve();
            }, error => {

                this.result = [{'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with saving ${fileName}`}];
                return Promise.reject(error);
            });
        },error => {

            this.result = [{'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with reading ${fileName}`}];
            return Promise.reject(error);
        });
    }

}

module.exports = SetDomainNameHandler;
