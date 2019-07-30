'use strict';

const homedir = require('os').homedir();
const env = 'tst';
module.exports = {
    tokenDir: `${homedir}/.mdbcli`,
    tokenFile: '/.auth',
    env,
    ... require(`./config.${env}`)
};
