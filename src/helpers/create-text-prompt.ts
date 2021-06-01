'use strict';

import inquirer from 'inquirer';

async function createTextPrompt(message: string, invalidMessage: string): Promise<string> {

    const result = await inquirer.createPromptModule()([{
        type: 'text',
        message,
        name: 'answer',
        validate: (value: string) => {
            /* istanbul ignore next */
            const valid = Boolean(value);
            /* istanbul ignore next */
            return valid || invalidMessage;
        }
    }]);

    return result.answer;
}

export default createTextPrompt;