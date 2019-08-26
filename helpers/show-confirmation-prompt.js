'use strict';

module.exports = {

    showConfirmationPrompt(message, defaultValue = true) {

        const { createPromptModule } = require('inquirer');

        return createPromptModule()([
            {
                type: 'confirm',
                name: 'answer',
                message,
                default: defaultValue
            }
        ]).then(input => input.answer);
    }
};
