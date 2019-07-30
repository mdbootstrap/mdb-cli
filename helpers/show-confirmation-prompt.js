'use strict';

const prompt = require('inquirer').createPromptModule();

module.exports = {

    showConfirmationPrompt(message, defaultValue = true) {

        return prompt([
            {
                type: 'confirm',
                name: 'answer',
                message,
                default: defaultValue
            }
        ]).then(input => input.answer);
    }
};
