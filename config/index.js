'use strict';

const env = 'dev';
module.exports = {
    env,
    ... require(`./config.${env}`)
};
