'use strict';

const fs = require('fs');

module.exports = {

    renameFolder(oldPath, newPath) {

        return new Promise((resolve, reject) => {

            fs.rename(oldPath, newPath, (err) => {

                if (err) reject(err);

                resolve();
            });
        });
    }
};