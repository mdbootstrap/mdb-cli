'use strict';


module.exports = {

    archiveProject(...args) {

        const archiver = require('archiver');

        return archiver(...args);
    }
};