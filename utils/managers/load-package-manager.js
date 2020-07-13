'use strict';

const PackageManagers = require('../../models/package-managers');
const YarnPackageManager = require('./yarn-package-manager');
const NpmPackageManager = require('./npm-package-manager');
const helpers = require('../../helpers');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

const configFile = path.join(process.cwd(), '.mdb');

const readDefaultManager = async () => {

    let result;

    try {

        result = await helpers.deserializeJsonFile(configFile);
    } catch (err) {

        return null;
    }

    return result.packageManager;
}

const saveDefaultManager = async (value) => {

    if (fs.existsSync(configFile)) {

        let content = await helpers.deserializeJsonFile(configFile);
        content.packageManager = value;
        helpers.serializeJsonFile(configFile, content);
    }
}

const chosePackageManager = async () => {

    const choices = [PackageManagers.YARN, PackageManagers.NPM];

    const result = await inquirer.createPromptModule()([{
        type: 'list',
        name: 'name',
        message: 'Which package manager do you use?',
        choices
    }]);

    return result.name;
};

const loadPackageManager = async () => {

    let manager = await readDefaultManager();

    if (!manager) {

        manager = await chosePackageManager();
        saveDefaultManager(manager);
    }

    switch (manager) {
        case 'npm': return new NpmPackageManager();
        case 'yarn': return new YarnPackageManager();
    }
}

module.exports = loadPackageManager;