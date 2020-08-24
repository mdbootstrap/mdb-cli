'use strict';

const fs = require('fs');

module.exports = {
    
    saveMdbConfig(filePath, content, commit) {
        const helpers = require('../helpers');

        return new Promise((resolve, reject) => {

            fs.writeFile(filePath, content, async (err) => {

                if (err) return reject(err);

                if (commit) await helpers.commitFile('.mdb', 'Add .mdb config file');

                resolve();
            });
        });
    }
};
