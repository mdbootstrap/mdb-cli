'use strict';

const AuthHandler = require('./auth-handler');

class SetNameHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.name = '';

        this.authHandler = authHandler;
    }

    getResult() {

        return this.result;
    }

    askForNewProjectName() {

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

    setName() {

        const { deserializeJsonFile } = require('../helpers/deserialize-object-from-file');
        const fileName = 'package.json';

        return deserializeJsonFile(fileName).then(fileContent => {

                const { serializeJsonFile } = require('../helpers/serialize-object-to-file');
                const oldName = fileContent.name;
                fileContent.name = this.name;

                return serializeJsonFile(fileName, fileContent).then(() => {

                        this.result = [{'Status': 'name changed', 'Message': `Package name has been changed from ${oldName} to ${this.name} successful`}];
                        return Promise.resolve();
                    }, error => {

                        this.result = [{'Status': 'name not changed', 'Message': `Problem with ${fileName} serialization`}];
                        return Promise.reject(error);
                    }
                );
            },error => {

                this.result = [{'Status': 'name not changed', 'Message': `Problem with ${fileName} deserialization`}];
                return Promise.reject(error);
            });
    }

}

module.exports = SetNameHandler;
