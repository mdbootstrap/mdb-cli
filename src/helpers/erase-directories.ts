'use strict';

import fs from 'fs';
import createConfirmationPrompt from './create-confirmation-prompt';
import removeFolder from './remove-folder';

async function eraseDirectories(path: string): Promise<string | undefined> {

    if (fs.existsSync(path)) {

        const answer = await createConfirmationPrompt(`It will erase data in ${path}. Continue?`);

        if (answer) {

            await removeFolder(path);

            return;
        }

        return Promise.reject('OK, will not delete existing folder.');
    }
}

export default eraseDirectories;