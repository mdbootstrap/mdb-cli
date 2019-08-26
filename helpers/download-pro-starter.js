'use strict';

const config = require('../config');
const fs = require('fs');
const HttpWrapper = require('../utils/http-wrapper');
const unzip = require('unzipper');
const Path = require('path');
const ProgressBar = require('progress');
const { Readable } = require('stream');

module.exports = {

    downloadProStarter(packageName, headers, path, projectName) {

        return new Promise((resolve, reject) => {

            const http = new HttpWrapper({
                port: config.port,
                hostname: config.host,
                path: `/packages/download/${packageName}`,
                method: 'GET',
                data: '',
                headers: headers
            });

            const request = http.createRequest((response) => {

                if (response.statusCode >= 400 && response.statusCode < 500) {

                    return reject(`${response.statusCode} ${response.statusMessage}`);
                }

                const readStream = new Readable();
                let result;

                readStream._read = () => { };

                let len = Number(response.headers['content-length']);

                const bar = new ProgressBar('[:bar] :eta s', {

                    complete: '=',
                    incomplete: ' ',
                    width: 100,
                    total: len
                });

                response.on('data', (chunk) => {

                    readStream.push(chunk);
                    bar.tick(chunk.length);
                });

                response.on('end', () => {

                    result = [{ 'Status': 'initialized', 'Message': 'Initialization completed.' }];

                    readStream.push(null);
                    console.log('\n');
                });

                try {

                    readStream.pipe(unzip.Extract({ path: path })).on('close', () => {

                        if (packageName !== projectName) {

                            const toRename = Path.join(path, packageName);
                            const destination = Path.join(path, projectName);

                            fs.rename(toRename, destination, (err) => {

                                if (err) reject(err);
                                else resolve(result);
                            });
                        } else {

                            resolve(result);
                        }
                    });
                } catch (e) {

                    console.log(e);

                    result = [{ 'Status': 'error', 'Message': 'Error initializing your project' }];

                    reject(result);
                }
            });

            request.on('error', reject);
            request.write('');
            request.end();
        });
    }
};
