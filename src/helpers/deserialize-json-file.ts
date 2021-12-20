'use strict';

import fs from 'fs';

export function deserializeJsonFile(filePath: string): Promise<any> {

    return new Promise((resolve, reject) => {

        fs.readFile(filePath, 'utf8', (error: any, content: string) => {

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
