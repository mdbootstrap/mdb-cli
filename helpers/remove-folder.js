'use strict';

const fse = require('fs-extra');

module.exports = folderPath => {

    fse.remove(folderPath, () => {});
};
