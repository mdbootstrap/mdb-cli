'use strict';

import HttpWrapper from '../utils/http-wrapper';
import ProgressBar from 'progress';
import { Readable } from 'stream';
import unzip from 'unzipper';

function downloadFromFTP(http: HttpWrapper, options: any, destination: string): Promise<string> {

    return new Promise((resolve, reject) => {

        const request = http.createRawRequest(options, (response) => {

            let result = '', message = '';

            const readStream = new Readable();

            readStream._read = () => { };

            const len = Number(response.headers['content-length']);

            const bar = new ProgressBar('[:bar] :eta s', {
                complete: '=',
                incomplete: ' ',
                width: 100,
                total: len
            });

            response.on('data', (chunk: any) => {

                if (response.statusCode === 200) {

                    readStream.push(chunk);
                    bar.tick(chunk.length);

                } else {

                    message += Buffer.from(chunk).toString('utf8');
                }
            });

            response.on('end', () => {

                const { statusCode, statusMessage } = response;

                if (statusCode === 200) {

                    result = 'Download completed.';

                    readStream.push(null);

                } else {

                    reject(message || statusMessage);
                }
            });

            try {

                readStream.pipe(unzip.Extract({ path: destination })).on('close', () => resolve(result));

            } catch (e) {

                reject('Download error.');
            }
        });

        request.on('error', reject);

        request.end();
    });
}

export default downloadFromFTP;
