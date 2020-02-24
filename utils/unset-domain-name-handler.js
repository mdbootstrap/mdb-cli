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

        const {deserializeJsonFile} = require('../helpers/deserialize-object-from-file');
        const fileName = 'package.json';

        return deserializeJsonFile(fileName).then(fileContent => {

            const {serializeJsonFile} = require('../helpers/serialize-object-to-file');
            delete fileContent.domainName;

            return serializeJsonFile(fileName, fileContent).then(() => {

                this.result = [{
                    'Status': CliStatus.SUCCESS,
                    'Message': 'Domain name has been deleted successfully'
                }];
                return Promise.resolve();
            }, error => {

                this.result = [{
                    'Status': CliStatus.INTERNAL_SERVER_ERROR,
                    'Message': `Problem with saving ${fileName}`
                }];
                return Promise.reject(error);
            });
        }, error => {

            this.result = [{
                'Status': CliStatus.INTERNAL_SERVER_ERROR,
                'Message': `Problem with reading ${fileName}`
            }];
            return Promise.reject(error);
        });
    }

}

module.exports = UnsetDomainNameHandler;
