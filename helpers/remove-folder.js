'use strict';

const fse = require('fs-extra');

module.exports = {

    removeFolder(path) {

        return new Promise((resolve, reject) => {

            fse.remove(path, (err) => {

                if (err) reject(err);

                resolve();
            });
        });
    }
};