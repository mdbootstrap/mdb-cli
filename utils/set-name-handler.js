'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config');
const HttpWrapper = require('../utils/http-wrapper');
const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const helpers = require('../helpers');
const loadPackageManager = require('./managers/load-package-manager');

class SetNameHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.cwd = process.cwd();
        this.newName = '';
        this.oldName = '';
        this.packageManager = null;
        this.args = [];

        this.authHandler = authHandler;
    }

    setArgs(args) {

        this.args = args;
    }

    getResult() {

        return this.result;
    }

    async loadPackageManager() {

        const gitPath = path.join(this.cwd, '.git');

        this.packageManager = await loadPackageManager(true, fs.existsSync(gitPath));
    }

    async askForNewProjectName() {

        if (this.args.length > 0) {

            this.newName = this.args[0];

            return;
        }

        this.newName = await helpers.showTextPrompt('Enter new project name', 'Project name must not be empty.');
    }

    async setName() {

        const packageJsonPath = path.join(this.cwd, 'package.json');
        let packageJson = {};

        try {

            packageJson = await helpers.deserializeJsonFile(packageJsonPath);
            this.oldName = packageJson.name;

            if (this.newName === this.oldName) {

                this.result = [{ 'Status': CliStatus.SUCCESS, 'Message': 'Project names are the same.' }];
                return Promise.reject(this.result);
            }

            packageJson.name = this.newName;

        } catch (e) {

            if (e.code === 'ENOENT') {

                const indexPhpPath = path.join(this.cwd, 'index.php');

                if (fs.existsSync(indexPhpPath)) return this.saveInConfigFile();

                return this.handleMissingPackageJson();

            }

            return Promise.reject([{ Status: CliStatus.CLI_ERROR, Message: 'Problem with `package.json` file deserialization.' }]);
        }

        try {

            await helpers.serializeJsonFile(packageJsonPath, packageJson);

        } catch (e) {

            this.result = [{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': 'Problem with saving package.json' }];
            return Promise.reject(this.result);
        }

        this.result = [{ 'Status': CliStatus.SUCCESS, 'Message': `Project name has been successfully changed from ${this.oldName} to ${this.newName}.` }];
    }

    handleMissingPackageJson() {

        return this.loadPackageManager()
            .then(() => helpers.createPackageJson(this.packageManager, this.cwd))
            .then(msg => this.result.push(msg))
            .then(() => this.setName())
            .catch(err => {

                this.result.push(err);
                this.result.push({ 'Status': CliStatus.ERROR, 'Message': 'Missing package.json file.' });

                console.table(this.result);
                process.exit(1);
            });
    }

    async saveInConfigFile() {

        const mdbFilePath = path.join(this.cwd, '.mdb');
        let mdbFileContent = {};

        try {

            mdbFileContent = await helpers.deserializeJsonFile(mdbFilePath);
            mdbFileContent.name = this.newName;

        } catch (e) {

            if (e.code !== 'ENOENT') {

                return Promise.reject([{ Status: CliStatus.CLI_ERROR, Message: 'Problem with `.mdb` file deserialization.' }]);
            }

            mdbFileContent.name = this.newName;
        }

        try {

            await helpers.serializeJsonFile(mdbFilePath, mdbFileContent);

        } catch (e) {

            if (e.code !== 'ENOENT') {

                return Promise.reject([{ Status: CliStatus.CLI_ERROR, Message: 'Problem with `.mdb` file serialization.' }]);
            }

            fs.writeFileSync(mdbFilePath, mdbFileContent, 'utf8');
        }

        this.result = [{ Status: CliStatus.SUCCESS, Message: 'Project name has been saved in .mdb file' }];
    }

    removeProject() {

        const options = {
            method: 'DELETE',
            port: config.port,
            hostname: config.host,
            path: `/project/unpublish/${this.oldName}`,
            headers: this.authHandler.headers
        };

        const http = new HttpWrapper(options);

        return http.delete();
    }
}

module.exports = SetNameHandler;
