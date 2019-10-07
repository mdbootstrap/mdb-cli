'use strict';

const { archiveProject } = require('./archiver-wrapper');
const { buildProject } = require('./build-project');
const { eraseProjectDirectories } = require('./erase-project-directories');
const { createPackageJson } = require('./create-package-json');
const { deserializeJsonFile } = require('./deserialize-object-from-file');
const { downloadProStarter } = require('./download-pro-starter');
const { fetchProducts } = require('./fetch-products');
const { getPackageName } = require('./get-project-name');
const { getSorted } = require('./get-sorted-products');
const { gitClone } = require('./git-clone');
const { removeFolder } = require('./remove-folder');
const { saveToken } = require('./save-token');
const { serializeJsonFile } = require('./serialize-object-to-file');
const { showConfirmationPrompt } = require('./show-confirmation-prompt');

module.exports = {
    archiveProject,
    buildProject,
    eraseProjectDirectories,
    createPackageJson,
    serializeJsonFile,
    deserializeJsonFile,
    downloadProStarter,
    fetchProducts,
    getPackageName,
    getSorted,
    gitClone,
    removeFolder,
    saveToken,
    showConfirmationPrompt
};
