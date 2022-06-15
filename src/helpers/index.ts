'use strict';

import { archiveProject } from './archiver-wrapper';
import { createCheckboxPrompt } from './create-checkbox-prompt';
import { createConfirmationPrompt } from './create-confirmation-prompt';
import { createJenkinsfile } from './create-jenkinsfile';
import { createListPrompt } from './create-list-prompt';
import { createPassPrompt } from './create-pass-prompt';
import { createTextPrompt } from './create-text-prompt';
import { deserializeJsonFile } from './deserialize-json-file';
import { downloadFromFTP } from './download-from-ftp';
import { eraseDirectories } from './erase-directories';
import { getThemeName } from './get-theme-name';
import { generateRandomString } from './generate-random-string';
import { removeFolder } from './remove-folder';
import { serializeJsonFile } from './serialize-json-file';

const helpers = {
    archiveProject,
    createCheckboxPrompt,
    createConfirmationPrompt,
    createJenkinsfile,
    createListPrompt,
    createPassPrompt,
    createTextPrompt,
    deserializeJsonFile,
    downloadFromFTP,
    eraseDirectories,
    generateRandomString,
    getThemeName,
    removeFolder,
    serializeJsonFile
};

export default helpers;
