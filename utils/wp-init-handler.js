'use strict';

const config = require('../config');
const AuthHandler = require('./auth-handler');
const HttpWrapper = require('../utils/http-wrapper');
const CliStatus = require('../models/cli-status');
const helpers = require('../helpers');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

class WpInitHandler {

    constructor(authHandler = new AuthHandler()) {

        this.authHandler = authHandler;
        this.themePath = undefined;
        this.freeTheme = false;
        this.pageType = undefined;
        this.cwd = process.cwd();
        this.options = {
            port: config.port,
            hostname: config.host,
            headers: this.authHandler.headers
        };
        this.result = [];
    }

    getResult() {

        return this.result;
    }

    async setArgs(args) {

        console.log('\n\x1b[34m%s\x1b[0m', ' Note:', 'This command should be executed in `wp-content/themes` directory.\n');

        this.freeTheme = args.some(arg => arg === '--free');
        const index = args.indexOf('--type');
        const pageType = args.find(arg => ['--type'].includes(arg.split('=')[0]));

        if (index !== -1 && args.length > index + 1) {
            this.pageType = args[index + 1];
        } else if (pageType) {
            this.pageType = pageType.split('=')[1];
        }

        if (!config.wpPageTypes.includes(this.pageType)) {

            const select = await inquirer.createPromptModule()([{
                type: 'list',
                name: 'name',
                message: 'Choose theme type',
                choices: config.wpPageTypes
            }]);

            this.pageType = select.name;
        }
    }

    async eraseDirectories() {

        const themeName = helpers.getThemeName(this.pageType);
        this.themePath = path.join(this.cwd, themeName);

        if (fs.existsSync(this.themePath)) {

            const answer = await helpers.showConfirmationPrompt(`It will erase data in ${themeName}. Continue?`)

            if (answer) {

                await helpers.removeFolder(themeName);

                return;
            }

            return Promise.reject([{ Status: CliStatus.SUCCESS, Message: 'OK, will not delete existing theme.' }]);
        }
    }

    async downloadTheme() {

        const query = this.freeTheme ? '?free=true' : '';

        this.options.path = `/packages/wordpress/${this.pageType}${query}`;

        const http = new HttpWrapper(this.options);

        this.result = await helpers.downloadFromFTP(http, this.cwd);

        await this.saveMetadata({ pageType: this.pageType });
    }

    async saveMetadata(metadata) {

        const metadataPath = path.join(this.themePath, '.mdb');
        const metadataExists = fs.existsSync(metadataPath);
        const projectMetadata = metadataExists ? await helpers.deserializeJsonFile(metadataPath) : {};

        if (metadataExists) {

            await helpers.serializeJsonFile(metadataPath, { ...projectMetadata, ...metadata });
        }
        else {

            fs.writeFileSync(metadataPath, JSON.stringify(metadata), 'utf8');
        }
    }
}

module.exports = WpInitHandler;
