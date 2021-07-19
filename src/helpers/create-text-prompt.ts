'use strict';

import inquirer from 'inquirer';

async function createTextPrompt(message: string, invalidMessage: string, validate: ((v: string) => boolean) | null = null): Promise<string> {

    const result = await inquirer.createPromptModule()([{
        type: 'text',
        message,
        name: 'answer',
        validate: (value: string) => {
            /* istanbul ignore next */
            const valid = validate ? validate(value) : Boolean(value);
            /* istanbul ignore next */
            return valid || invalidMessage;
        }
    }]);

    return result.answer;
}

export default createTextPrompt;