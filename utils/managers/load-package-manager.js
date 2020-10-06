'use strict';

const PackageManagers = require('../../models/package-managers');
const YarnPackageManager = require('./yarn-package-manager');
const NpmPackageManager = require('./npm-package-manager');
const CliStatus = require('../../models/cli-status');
const helpers = require('../../helpers');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

const getConfigFilePath = (cwd) => path.join(cwd || process.cwd(), '.mdb');

const readDefaultManager = async () => {

    let result;

    try {

        result = await helpers.deserializeJsonFile(getConfigFilePath());
    } catch (err) {

        if (err.toString().toLowerCase().indexOf('unexpected token') !== -1) {

            return Promise.reject({ Status: CliStatus.CLI_ERROR, Message: '.mdb file is invalid. Please remove it and try again.'});
        }

        return null;
    }

    return result.packageManager;
};

const saveDefaultManager = async (value, commit, cwd) => {

    try {

        const configFile = getConfigFilePath(cwd);

        if (fs.existsSync(configFile)) {

            let content = await helpers.deserializeJsonFile(configFile);
            content.packageManager = value;
            await helpers.serializeJsonFile(configFile, content);
            if (commit) await helpers.commitFile('.mdb', 'Add settings to .mdb config file');

        } else {

            await helpers.saveMdbConfig(configFile, JSON.stringify({ packageManager: value }), commit);
        }
    } catch (err) {

        console.error(err)
    }
};

const selectPackageManager = async () => {

    const choices = [PackageManagers.NPM, PackageManagers.YARN];

    const result = await inquirer.createPromptModule()([{
        type: 'list',
        name: 'name',
        message: 'Which package manager do you use?',
        choices
    }]);

    return result.name;
};

const loadPackageManager = async (save = true, commit = false, cwd) => {

    let manager = await readDefaultManager();

    if (!manager) {

        manager = await selectPackageManager();
        if (save) await saveDefaultManager(manager, commit, cwd);
    }

    switch (manager) {
        case 'npm': return new NpmPackageManager();
        case 'yarn': return new YarnPackageManager();
    }
};

module.exports = loadPackageManager;
