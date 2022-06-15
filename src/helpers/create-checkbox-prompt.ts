'use strict';

import inquirer from 'inquirer';

export async function createCheckboxPrompt(message: string, choices: Object[]): Promise<string[]> {

    const result = await inquirer.createPromptModule()([{
        type: 'checkbox',
        name: 'name',
        message,
        choices
    }]);

    return result.name;
}
