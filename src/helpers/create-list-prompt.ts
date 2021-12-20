'use strict';

import inquirer from 'inquirer';

export async function createListPrompt(message: string, choices: Object[]): Promise<string> {

    const result = await inquirer.createPromptModule()([{
        type: 'list',
        name: 'name',
        message,
        choices
    }]);

    return result.name;
}
