'use strict';

const fs = require('fs');

module.exports = {

    serializeJsonFile(fileName, object) {

        return new Promise((resolve, reject) => {

            const serializedObject = JSON.stringify(object, null, '  ');

            fs.writeFile(fileName, serializedObject, 'utf-8', (error) => {

                error ? reject(error) : resolve();
            });
        });
    }

};
