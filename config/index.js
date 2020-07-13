'use strict';

const homedir = require('os').homedir();
const env = process.env.NODE_ENV || 'prd';
const projectsDomain = process.env.PROJECTS_DOMAIN || 'https://mdbgo.dev';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
process.env['NODE_NO_WARNINGS'] = 1;
module.exports = {
    tokenDir: `${homedir}/.mdbcli`,
    tokenFile: '/.auth',
    env,
    port: process.env.PORT || 3030,
    host: process.env.HOST || 'localhost',
    projectsDomain
};
