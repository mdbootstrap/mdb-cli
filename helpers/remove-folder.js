'use strict';

const fse = require('fs-extra');

module.exports = {

    removeFolder(folderPath) {

        return new Promise((resolve, reject) => {

            fse.remove(folderPath, (err) => {

                if (err) reject(err);

                resolve();
            });
        });
    }
};