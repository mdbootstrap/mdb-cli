'use strict';

const homedir = require('os').homedir();
const env = 'dev';
module.exports = {
    tokenDir: `${homedir}/.mdbcli`,
    tokenFile: '/.auth',
    env,
    port: process.env.PORT || 3030,
    host: process.env.HOST || 'localhost'
};
