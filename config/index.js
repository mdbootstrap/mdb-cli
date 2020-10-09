'use strict';

const homedir = require('os').homedir();
const env = process.env.NODE_ENV || 'prd';
const gitlabUrl = process.env.GITLAB_URL || 'https://git.mdbgo.com';
const projectsDomain = process.env.PROJECTS_DOMAIN || 'https://mdbgo.dev';
const technologies = process.env.BACKEND_TECHNOLOGIES || 'node8,node10,node12,php7.2,php7.3,php7.4';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
process.env['NODE_NO_WARNINGS'] = 1;
module.exports = {
    env,
    gitlabUrl,
    projectsDomain,
    backendTechnologies: technologies.split(','),
    tokenFile: '/.auth',
    tokenDir: `${homedir}/.mdbcli`,
    port: process.env.PORT || 3030,
    host: process.env.HOST || 'localhost',
};
