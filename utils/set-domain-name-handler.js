'use strict';

const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const helpers = require('../helpers/');

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

        return helpers.showTextPrompt('Enter domain name', 'Domain name must not be empty.')
            .then(answer => this.name = answer);
    }

    setDomainName() {

        return new Promise((resolve, reject) => {

            const fileName = 'package.json';

            helpers.deserializeJsonFile(fileName).then(fileContent => {

                if (fileContent.domainName && fileContent.domainName === this.name) {

                    return reject([{ 'Status': CliStatus.SUCCESS, 'Message': 'Domain names are the same.' }]);
                }

                fileContent.domainName = this.name;

                helpers.serializeJsonFile(fileName, fileContent).then(() => {

                    this.result = [{ 'Status': CliStatus.SUCCESS, 'Message': `Domain name has been changed to ${this.name} successfully` }];
                    resolve();

                }).catch(e => {

                    console.log(e);
                    return reject([{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with saving ${fileName}` }]);
                });

            }).catch(e => {

                console.log(e);
                reject([{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with reading ${fileName}` }]);
            });
        });
    }

}

module.exports = SetDomainNameHandler;
