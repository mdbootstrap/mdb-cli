'use strict';

const fs = require('fs');

module.exports = {
    
    async eraseDirectories(path) {
        
        const { createConfirmationPrompt, removeFolder } = require('../helpers');

        if (fs.existsSync(path)) {

            const answer = await createConfirmationPrompt(`It will erase data in ${path}. Continue?`);

            if (answer) {

                await removeFolder(path);

                return;
            }

            return Promise.reject('OK, will not delete existing folder.');
        }
    }
}