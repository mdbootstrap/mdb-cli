'use strict';

import archiveProject from './archiver-wrapper';
import createConfirmationPrompt from './create-confirmation-prompt';
import createJenkinsfile from './create-jenkinsfile';
import createListPrompt from './create-list-prompt';
import createTextPrompt from './create-text-prompt';
import deserializeJsonFile from './deserialize-json-file';
import downloadFromFTP from './download-from-ftp';
import eraseDirectories from './erase-directories';
import removeFolder from './remove-folder';
import serializeJsonFile from './serialize-json-file';
import getThemeName from './get-theme-name';
import {generateRandomString} from "./generate-random-string";

const helpers = {
    archiveProject,
    createConfirmationPrompt,
    createJenkinsfile,
    createListPrompt,
    createTextPrompt,
    deserializeJsonFile,
    downloadFromFTP,
    eraseDirectories,
    getThemeName,
    removeFolder,
    serializeJsonFile,
    generateRandomString
};

export default helpers;
