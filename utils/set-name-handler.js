'use strict';

const AuthHandler = require('./auth-handler');

class SetNameHandler {

    constructor() {

        this.result = [];
        this.name = '';

        this.authHandler = new AuthHandler();
    }

    getResult() {

        return this.result;
    }

    askNewName() {

        const prompt = require('inquirer').createPromptModule();

        return prompt([
            {
                type: 'text',
                message: 'Set new project name',
                name: 'name',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value);
                    /* istanbul ignore next */
                    return valid || 'Project name must not be empty.';
                }
            }
        ])
            .then((answers) => {
                this.name = answers.name;
            });
    }

    async setName() {

        const fileName = 'package.json';
        let fileContent = await this.getObjectFromFile(fileName);
        const oldName = fileContent.name;

        fileContent.name = this.name;
        await this.saveObjectToFile(fileContent, fileName);
        this.result = [{'Status': 'name changed', 'Message': `Package name change from ${oldName} to ${this.name} successful`}];
        return Promise.resolve();
    }

    getObjectFromFile(fileName) {

        const { deserializeJsonFile } = require('../helpers/deserializer');

        return deserializeJsonFile(fileName).catch(error => {

            this.result = [{'Status': 'name not changed', 'Message': `Problem with ${fileName} deserialization`}];
            return Promise.reject(error);
        });
    }

    saveObjectToFile(fileName, object) {

        const { serializeJsonFile } = require('../helpers/serializer');

        return serializeJsonFile(fileName, object).catch(error => {

                this.result = [{'Status': 'name not changed', 'Message': `Problem with ${fileName} serialization`}];
                return Promise.reject(error);
            }
        );
    }

}

module.exports = SetNameHandler;
