'use strict';

const fs = require('fs');

module.exports = {

    serializeJsonFile(filePath, object) {

        return new Promise((resolve, reject) => {

            const serializedObject = JSON.stringify(object, null, '  ');

            fs.writeFile(filePath, serializedObject, 'utf-8', (error) => {

                error ? reject(error) : resolve();
            });
        });
    }

};
