'use strict';

const inquirer = require('inquirer');

module.exports = {

    async createTextPrompt(message, invalidMessage) {

        const result = await inquirer.createPromptModule()([{
            type: 'text',
            message,
            name: 'answer',
            validate: (value) => {
                /* istanbul ignore next */
                const valid = Boolean(value);
                /* istanbul ignore next */
                return valid || invalidMessage;
            }
        }]);

        return result.answer;
    }
};
