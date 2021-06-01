'use strict';

import inquirer from 'inquirer';

async function createListPrompt(message: string, choices: Object[]): Promise<string> {

    const result = await inquirer.createPromptModule()([{
        type: 'list',
        name: 'name',
        message,
        choices
    }]);

    return result.name;
}

export default createListPrompt;