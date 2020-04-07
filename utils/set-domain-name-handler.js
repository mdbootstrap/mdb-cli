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

        return new Promise((resolve, reject) => {

            const fileName = 'package.json';

            const { deserializeJsonFile } = require('../helpers/deserialize-object-from-file');

            deserializeJsonFile(fileName).then(fileContent => {

                if (fileContent.domainName && fileContent.domainName === this.name) {

                    reject([{ 'Status': CliStatus.SUCCESS, 'Message': 'Domain names are the same.' }]);
                }

                fileContent.domainName = this.name;

                const { serializeJsonFile } = require('../helpers/serialize-object-to-file');

                serializeJsonFile(fileName, fileContent).then(() => {

                    this.result = [{ 'Status': CliStatus.SUCCESS, 'Message': `Domain name has been changed to ${this.name} successfully` }];
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

}

module.exports = SetDomainNameHandler;
