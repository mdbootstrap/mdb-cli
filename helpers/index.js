'use strict';

const { archiveProject } = require('./archiver-wrapper');
const { buildProject } = require('./build-project');
const { commitFile } = require('./commit-file');
const { createJenkinsfile } = require('./create-jenkinsfile');
const { createPackageJson } = require('./create-package-json');
const { deserializeJsonFile } = require('./deserialize-object-from-file');
const { downloadFromFTP } = require('./download-from-ftp');
const { downloadProStarter } = require('./download-pro-starter');
const { downloadUserProject } = require('./download-user-project');
const { eraseProjectDirectories } = require('./erase-project-directories');
const { fetchProducts } = require('./fetch-products');
const { getPackageName } = require('./get-project-name');
const { getSorted } = require('./get-sorted-products');
const { getThemeName } = require('./get-theme-name');
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
    createPackageJson,
    deserializeJsonFile,
    downloadFromFTP,
    downloadProStarter,
    downloadUserProject,
    eraseProjectDirectories,
    fetchProducts,
    getPackageName,
    getSorted,
    getThemeName,
    gitClone,
    removeFolder,
    saveMdbConfig,
    saveToken,
    serializeJsonFile,
    showConfirmationPrompt,
    showTextPrompt
};
