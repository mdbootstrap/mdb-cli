'use strict';

const homedir = require('os').homedir();
const env = process.env.NODE_ENV || 'prd';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
module.exports = {
    tokenDir: `${homedir}/.mdbcli`,
    tokenFile: '/.auth',
    env,
    port: process.env.PORT || 3030,
    host: process.env.HOST || 'localhost'
};
