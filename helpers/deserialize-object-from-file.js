'use strict';

const fs = require('fs');

module.exports = {

    deserializeJsonFile(filePath) {

        return new Promise((resolve, reject) => {

            fs.readFile(filePath, 'utf8', (error, content) => {

                error ? reject(error) : resolve(JSON.parse(content));
            });
        });
    }
};
