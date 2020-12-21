'use strict';

const config = require('../config');
const HttpWrapper = require('../utils/http-wrapper');
const { downloadFromFTP } = require('./download-from-ftp');

module.exports = {

    downloadUserProject(projectName, headers, destination, force) {

        const query = force ? '?force=true' : '';

        const http = new HttpWrapper({
            port: config.port,
            hostname: config.host,
            path: `/project/get/${projectName}${query}`,
            method: 'GET',
            data: '',
            headers: headers
        });

        return downloadFromFTP(http, destination);
    }
};
