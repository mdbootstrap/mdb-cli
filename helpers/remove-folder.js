'use strict';

const fse = require('fs-extra');

module.exports = {

    removeFolder(folderPath, action = () => {}) {

        return fse.remove(folderPath, action);
    }
};
