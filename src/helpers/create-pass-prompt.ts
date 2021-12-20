'use strict';

import inquirer from 'inquirer';

export async function createPassPrompt(message: string, invalidMessage: string, validate: ((v: string) => boolean) | null = null): Promise<string> {

    const result = await inquirer.createPromptModule()([{
        type: 'password',
        message,
        name: 'password',
        mask: '*',
        validate: (value: string) => {
            /* istanbul ignore next */
            const valid = validate ? validate(value) : Boolean(value);
            /* istanbul ignore next */
            return valid || invalidMessage;
        }
    }]);

    return result.password;
}
