'use strict';

const CliStatus = require('../models/cli-status');
const ProgressBar = require('progress');
const { Readable } = require('stream');
const unzip = require('unzipper');

module.exports = {

    downloadFromFTP(http, destination) {

        return new Promise((resolve, reject) => {

            const request = http.createRequest((response) => {

                let result, message = '';

                const readStream = new Readable();

                readStream._read = () => { };

                const len = Number(response.headers['content-length']);

                const bar = new ProgressBar('[:bar] :eta s', {
                    complete: '=',
                    incomplete: ' ',
                    width: 100,
                    total: len
                });

                response.on('data', (chunk) => {

                    if (response.statusCode === CliStatus.HTTP_SUCCESS) {

                        readStream.push(chunk);
                        bar.tick(chunk.length);

                    } else {

                        message += Buffer.from(chunk).toString('utf8');
                    }
                });

                response.on('end', () => {

                    const { statusCode, statusMessage } = response;

                    if (statusCode === CliStatus.HTTP_SUCCESS) {

                        result = [{ Status: CliStatus.SUCCESS, Message: 'Download completed.' }];

                        readStream.push(null);
                        console.log('\n');

                    } else {

                        reject({ Status: statusCode, Message: message || statusMessage });
                    }
                });

                try {

                    readStream.pipe(unzip.Extract({ path: destination })).on('close', () => resolve(result));

                } catch (e) {

                    reject({ Status: CliStatus.INTERNAL_SERVER_ERROR, Message: 'Download error.' });
                }
            });

            request.on('error', reject);

            request.end();
        });
    }
};
