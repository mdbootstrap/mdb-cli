'use strict';

module.exports = {

    deserializeJsonFile(filePath) {

        const fs = require('fs');

        return new Promise((resolve, reject) => {

            fs.readFile(filePath, 'utf8', (error, content) => {

                error ? reject(error) : resolve(JSON.parse(content))
            });
        })
    }

};
