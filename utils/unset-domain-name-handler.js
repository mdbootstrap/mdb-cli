'use strict';

const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');

class UnsetDomainNameHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];

        this.authHandler = authHandler;
    }

    getResult() {

        return this.result;
    }

    unsetDomainName() {

        return new Promise((resolve, reject) => {

            const fileName = 'package.json';

            const { deserializeJsonFile } = require('../helpers/deserialize-object-from-file');

            deserializeJsonFile(fileName).then(fileContent => {

                if (!fileContent.domainName) {

                    return reject([{ 'Status': CliStatus.NOT_FOUND, 'Message': 'No domain name' }]);
                }

                delete fileContent.domainName;

                const { serializeJsonFile } = require('../helpers/serialize-object-to-file');

                serializeJsonFile(fileName, fileContent).then(() => {

                    this.result = [{ 'Status': CliStatus.SUCCESS, 'Message': 'Domain name has been deleted successfully' }];
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

module.exports = UnsetDomainNameHandler;