'use strict';

const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const helpers = require('../helpers/');
const path = require('path');
const fs = require('fs');

class SetDomainNameHandler {

    constructor(authHandler = new AuthHandler()) {

        this.args = [];
        this.cwd = process.cwd();
        this.domainName = '';
        this.result = [];

        this.authHandler = authHandler;
    }

    setArgs(args) {

        this.args = args;
    }

    getResult() {

        return this.result;
    }

    async askForDomainName() {

        if (this.args.length > 0) {

            this.domainName = this.args[0];

            return;
        }

        this.domainName = await helpers.showTextPrompt('Enter domain name', 'Domain name must not be empty.');
    }

    async setDomainName() {

        const packageJsonPath = path.join(this.cwd, 'package.json');
        let packageJson = {};

        try {

            packageJson = await helpers.deserializeJsonFile(packageJsonPath);

        } catch (e) {

            if (e.code === 'ENOENT') {

                const indexPhpPath = path.join(this.cwd, 'index.php');

                if (fs.existsSync(indexPhpPath)) return this.saveInConfigFile();

                return this.handleMissingPackageJson();
            }

            return Promise.reject([{ Status: CliStatus.CLI_ERROR, Message: 'Could not read `package.json` file.' }]);
        }

        this.oldName = packageJson.domainName;

        if (this.domainName === this.oldName) {

            return Promise.reject([{ Status: CliStatus.SUCCESS, Message: 'Domain names are the same.' }]);
        }

        packageJson.domainName = this.domainName;

        try {

            await helpers.serializeJsonFile(packageJsonPath, packageJson);

        } catch (e) {

            return Promise.reject([{ Status: CliStatus.CLI_ERROR, Message: 'Could not save `package.json` file.' }]);
        }

        this.result = [{ Status: CliStatus.SUCCESS, Message: 'Domain name has been saved in package.json file' }];
    }

    handleMissingPackageJson() {

        return helpers.createPackageJson(null, this.cwd).then(() => this.setDomainName());
    }

    async saveInConfigFile() {

        const mdbFilePath = path.join(this.cwd, '.mdb');
        let mdbFileContent = {};

        try {

            mdbFileContent = await helpers.deserializeJsonFile(mdbFilePath);
            mdbFileContent.domainName = this.domainName;

        } catch (e) {

            if (e.code !== 'ENOENT') {

                return Promise.reject([{ Status: CliStatus.CLI_ERROR, Message: 'Could not read `.mdb` file.' }]);
            }

            mdbFileContent.domainName = this.domainName;
        }

        try {

            await helpers.serializeJsonFile(mdbFilePath, mdbFileContent);

        } catch (e) {

            if (e.code !== 'ENOENT') {

                return Promise.reject([{ Status: CliStatus.CLI_ERROR, Message: 'Could not save `.mdb` file.' }]);
            }

            fs.writeFileSync(mdbFilePath, mdbFileContent, 'utf8');
        }

        this.result = [{ Status: CliStatus.SUCCESS, Message: 'Domain name has been saved in .mdb file' }];
    }
}

module.exports = SetDomainNameHandler;
