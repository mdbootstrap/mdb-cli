'use strict';

const inquirer = require('inquirer');

module.exports = {

    async createListPrompt(message, choices) {

        const result = await inquirer.createPromptModule()([{
            type: 'list',
            name: 'name',
            message,
            choices
        }]);

        return result.name;
    }
};