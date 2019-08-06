'use strict';

const { buildProject } = require('./build-project');
const { eraseProjectDirectories } = require('./erase-project-directories');
const { createPackageJson } = require('./create-package-json');
const { deserializeJsonFile } = require('./deserialize-object-from-file');
const { downloadProStarter } = require('./download-pro-starter');
const { fetchProducts } = require('./fetch-products');
const { getSorted } = require('./get-sorted-product');
const { gitClone } = require('./git-clone');
const { removeFolder } = require('./remove-folder');
const { saveToken } = require('./save-token');
const { getPackageName } = require('./get-project-name');
const { showConfirmationPrompt } = require('./show-confirmation-prompt');

module.exports = {
    buildProject,
    eraseProjectDirectories,
    createPackageJson,
    deserializeJsonFile,
    downloadProStarter,
    fetchProducts,
    getSorted,
    gitClone,
    removeFolder,
    saveToken,
    getPackageName,
    showConfirmationPrompt
};
