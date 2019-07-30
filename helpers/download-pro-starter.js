'use strict';

module.exports = {

    downloadProStarter(packageName, headers, path) {

        return new Promise((resolve, reject) => {

            const HttpWrapper = require('../utils/http-wrapper');
            const config = require('../config');
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

                const unzip = require('unzipper');
                const ProgressBar = require('progress');
                const { Readable } = require('stream');
                const readStream = new Readable();
                let result;

                readStream._read = () => { };

                try {

                    readStream.pipe(unzip.Extract({ path: `${path}` }));
                } catch (e) {

                    console.log(e);

                    result = [{ 'Status': 'error', 'Message': 'Error initializing your project' }];

                    reject(result);
                }

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

                    readStream.push(null);

                    console.log('\n');

                    result = [{ 'Status': 'initialized', 'Message': 'Initialization completed.' }];

                    resolve(result);
                })
            });

            request.on('error', reject);
            request.write('');
            request.end();
        });
    }
};
