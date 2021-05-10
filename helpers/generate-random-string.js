'use strict';

const crypto = require('crypto');

module.exports = {
    generateRandomString(length = 8) {

    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
    }
};
