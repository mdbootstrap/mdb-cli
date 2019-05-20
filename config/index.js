'use strict';

const env = 'prd';
module.exports = {
    env,
    ... require(`./config.${env}`)
};
