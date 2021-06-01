'use strict';

import fs from 'fs';

function serializeJsonFile(filePath: string, object: object): Promise<void> {

    return new Promise((resolve, reject) => {

        const serializedObject = JSON.stringify(object, null, '  ');

        fs.writeFile(filePath, serializedObject, 'utf-8', (error) => {

            error ? reject(error) : resolve();
        });
    });
}

export default serializeJsonFile;