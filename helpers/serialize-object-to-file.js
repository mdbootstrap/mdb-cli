'use strict';

module.exports = {

    serializeJsonFile(fileName, object) {

        const fs = require('fs');

        return new Promise((resolve, reject) => {

            const serializedObject = JSON.stringify(object, null, '  ');

            fs.writeFile(fileName, serializedObject, 'utf-8', (error) => {

                error ? reject(error) : resolve()
            });
        })
    }

};
