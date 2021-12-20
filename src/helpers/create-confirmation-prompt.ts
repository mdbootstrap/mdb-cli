'use strict';

import inquirer from 'inquirer';

export async function createConfirmationPrompt(message: string, defaultValue = true): Promise<boolean> {

    const result = await inquirer.createPromptModule()([{
        type: 'confirm',
        name: 'answer',
        message,
        default: defaultValue
    }]);

    return result.answer;
}
