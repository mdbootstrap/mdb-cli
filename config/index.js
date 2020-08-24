'use strict';

const homedir = require('os').homedir();
const env = process.env.NODE_ENV || 'prd';
const gitlabUrl = process.env.GITLAB_URL || 'https://git.mdbgo.com';
const projectsDomain = process.env.PROJECTS_DOMAIN || 'https://mdbgo.dev';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
process.env['NODE_NO_WARNINGS'] = 1;
module.exports = {
    env,
    gitlabUrl,
    projectsDomain,
    tokenFile: '/.auth',
    tokenDir: `${homedir}/.mdbcli`,
    port: process.env.PORT || 3030,
    host: process.env.HOST || 'localhost',
};
