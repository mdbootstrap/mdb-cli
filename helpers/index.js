'use strict';

const { archiveProject } = require('./archiver-wrapper');
const { buildProject } = require('./build-project');
const { commitFile } = require('./commit-file');
const { createJenkinsfile } = require('./create-jenkinsfile');
const { eraseProjectDirectories } = require('./erase-project-directories');
const { createPackageJson } = require('./create-package-json');
const { deserializeJsonFile } = require('./deserialize-object-from-file');
const { downloadProStarter } = require('./download-pro-starter');
const { fetchProducts } = require('./fetch-products');
const { getPackageName } = require('./get-project-name');
const { getSorted } = require('./get-sorted-products');
const { gitClone } = require('./git-clone');
const { removeFolder } = require('./remove-folder');
const { saveMdbConfig } = require('./save-mdb-config');
const { saveToken } = require('./save-token');
const { serializeJsonFile } = require('./serialize-object-to-file');
const { showConfirmationPrompt } = require('./show-confirmation-prompt');
const { showTextPrompt } = require('./show-text-prompt');

module.exports = {
    archiveProject,
    buildProject,
    commitFile,
    createJenkinsfile,
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
    saveMdbConfig,
    saveToken,
    showConfirmationPrompt,
    showTextPrompt
};
