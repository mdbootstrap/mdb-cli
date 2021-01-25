'use strict';

const fs = require('fs');

module.exports = {

    deserializeJsonFile(filePath) {

        return new Promise((resolve, reject) => {

            fs.readFile(filePath, 'utf8', (error, content) => {

                if (error) {

                    return reject(error);
                }

                try {

                    const result = JSON.parse(content);

                    resolve(result);

                } catch (err) {

                    reject(err);
                }
            });
        });
    }
};
