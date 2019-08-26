'use strict';

const fs = require('fs');
const globals = require('../config/index');

module.exports = {

    saveToken(userToken) {

        if (userToken) {

            const tokenDir = globals.tokenDir;
            const tokenFile = tokenDir + globals.tokenFile;

            fs.mkdir(tokenDir, { recursive: true, mode: 0o755 }, (err => {

                if (err && err.code !== 'EEXIST') throw err;

                fs.writeFile(tokenFile, userToken, {encoding: 'utf8', mode: 0o644}, (err => {

                    if (err) throw err;
                }));
            }));

            return true;
        }

        return false;
    }
};
