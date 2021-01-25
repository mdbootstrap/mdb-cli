'use strict';

const inquirer = require('inquirer');

module.exports = {

    async createConfirmationPrompt(message, defaultValue = true) {

        const result = await inquirer.createPromptModule()([{
            type: 'confirm',
            name: 'answer',
            message,
            default: defaultValue
        }]);

        return result.answer;
    }
};