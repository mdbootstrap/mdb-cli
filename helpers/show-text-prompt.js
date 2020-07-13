'use strict';

module.exports = {

    showTextPrompt(message, invalidMessage) {

        const { createPromptModule } = require('inquirer');

        return createPromptModule()([
            {
                type: 'text',
                message,
                name: 'answer',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value);
                    /* istanbul ignore next */
                    return valid || invalidMessage;
                }
            }
        ]).then(input => input.answer);
    }
};
