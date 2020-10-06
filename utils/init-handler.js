'use strict';

const AuthHandler = require('./auth-handler');
const HttpWrapper = require('../utils/http-wrapper');
const { parseArgs } = require('../helpers/parse-args');
const loadPackageManager = require('./managers/load-package-manager');
const CliStatus = require('../models/cli-status');
const helpers = require('../helpers');
const config = require('../config');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

const INIT_ARGS_MAP = {
    '-n': 'projectName', '--name': 'projectName'
};

class InitHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.options = [];
        this.cwd = process.cwd();
        this.projectSlug = '';
        this.projectName = '';
        this.projectRoot = '';
        this.authHeaders = {};
        this._promptShownCount = 0;
        this.authHandler = authHandler;
        this.args = { projectName: '', blank: false };
        this.isFreePackage = true;
        this.packageManager = null;

        this.setAuthHeader();
    }

    setArgs(args) {

        const flags = ['-b', '--blank'];

        flags.forEach(flag => {

            if (args.includes(flag)) {

                args.splice(args.indexOf(flag), 1);
                this.args.blank = true;
            }
        });

        this.args = { ...this.args, ...parseArgs(args, INIT_ARGS_MAP) };
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.authHeaders = this.authHandler.headers;
    }

    getResult() {

        return this.result;
    }

    getAvailableOptions() {

        if (this.args.blank) {

            return Promise.resolve();
        }

        return helpers.fetchProducts(this.authHeaders)
            .then((orders) => {

                orders = typeof orders === 'string' ? JSON.parse(orders) : orders;
                this.options = helpers.getSorted(orders, 'productTitle');
            })
            .catch((error) => Promise.reject(error));
    }

    showUserPrompt() {

        if (this.args.blank) {

            return Promise.resolve();
        }

        const choices = this.options.map((row) => ({
            name: row.productTitle,
            short: row.productSlug,
            value: row.productSlug
        }));
        choices.push({ name: 'Blank project', short: 'blank', value: 'blank' });

        return inquirer.createPromptModule()([
            {
                type: 'list',
                name: 'projectSlug',
                message: 'Choose project to initialize',
                choices
            }
        ])
            .then((select) => this._handleUserProjectSelect(select));
    }

    initProject() {

        const packageJsonPath = path.join(this.cwd, 'package.json');

        if (fs.existsSync(packageJsonPath)) {

            return helpers.showConfirmationPrompt('There is already an npm project in this location, are you sure you want to init it here?')
                .then((confirmed) => {

                    if (confirmed && this.args.blank) return this._initEmptyProject();
                    else if (confirmed) return this._download();
                    else this.result.push({ Status: CliStatus.SUCCESS, Message: 'OK, will not initialize project in this location.' });
                });
        } else {

            if (this.args.blank) return this._initEmptyProject();
            else return this._download();
        }
    }

    _initEmptyProject() {

        return this.askForProjectName()
            .then(() => helpers.eraseProjectDirectories(this.projectSlug, this.projectName))
            .then(() => this.createDirectory())
            .then(() => this.loadPackageManager(this.projectRoot))
            .then(() => this.createPackageJson())
            .then(() => this.saveMetadata())
            .catch(err => this.result = [err]);
    }

    async askForProjectName() {

        if (this.args.projectName) {

            this.projectName = this.args.projectName;

            return;
        }

        this.projectName = await helpers.showTextPrompt('Enter project name', 'Project name must not be empty.');

        this.projectRoot = path.join(this.cwd, this.projectName);


        await this._checkProjectNameExists();
    }

    createDirectory() {

        return new Promise((resolve, reject) => {

            fs.mkdir(this.projectRoot, err => {

                if (err) {

                    return reject({ Status: CliStatus.ERROR, Message: `Error: ${err}` });
                }

                resolve();
            });
        });
    }

    async loadPackageManager(cwd) {

        this.packageManager = await loadPackageManager(true, false, cwd);
    }

    createPackageJson() {

        return new Promise((resolve, reject) => {

            const init = this.packageManager.init(this.projectRoot);

            init.on('error', (error) => reject({ Status: CliStatus.ERROR, Message: error.message }));

            init.on('exit', (code) => {

                if (code === CliStatus.SUCCESS) {

                    this.result.push({ Status: CliStatus.SUCCESS, Message: `Project ${this.projectName} successfully created` });
                    resolve();

                } else {

                    reject({ Status: code, Message: 'Problem with project initialization' })
                }
            });
        });
    }

    addJenkinsfile() {

        return helpers.createJenkinsfile(this.projectRoot);
    }

    _download() {

        return helpers.eraseProjectDirectories(this.projectSlug, this.projectName)
            .then(() => helpers.downloadProStarter(this.projectSlug, this.authHeaders, this.cwd, this.projectName))
            .then(result => {

                this.result = result;
                return this.saveMetadata()
                    .then(() => this.notifyServer())
                    .catch(console.error);
            })
            .catch((err) => this.result = [err]);
    }

    _handleUserProjectSelect(select) {

        if (this._promptShownCount++ >= 10) {

            console.table([{ 'Status': CliStatus.SEE_OTHER, 'Message': 'Please run `mdb list` to see available packages.' }]);

            return process.exit(0);
        }

        const { projectSlug } = select;

        if (projectSlug === 'blank') {

            this.projectSlug = projectSlug;

            this.args.blank = true;

            return Promise.resolve();
        }

        const project = this.options.find((row) => row.productSlug === projectSlug);

        if (!project.available) {

            console.log(`You cannot create this project. Please visit https://mdbootstrap.com/products/${project.productSlug}/ and make sure it is available for you.`);

            return this.showUserPrompt();
        }

        this._setProjectInfo(project);

        return this._checkProjectNameExists();
    }

    _setProjectInfo(project) {

        const { productSlug } = project;
        this.isFreePackage = project.productId === null;

        this.projectSlug = productSlug;

        this.projectName = this.args.projectName ? this.args.projectName : this.projectSlug;
        this.projectRoot = path.join(this.cwd, this.projectName);
    }

    async _checkProjectNameExists() {

        if (fs.existsSync(this.projectRoot)) {

            const confirmed = await helpers.showConfirmationPrompt(`Folder ${this.projectName} already exists, do you want to rename project you are creating now?`, true);

            if (confirmed) {

                this.projectName = await helpers.showTextPrompt('Enter new project name', 'Project name must not be empty.');

                this.projectRoot = path.join(this.cwd, this.projectName);

                await this._checkProjectNameExists();
            }
        }
    }

    async saveMetadata() {

        const metadataPath = path.join(this.projectRoot, '.mdb');

        let metadataFile = {};
        try {

            metadataFile = await helpers.deserializeJsonFile(metadataPath);

        } catch (e) {
            // it means the file cannot be accessed, so it will be created in the next try..catch
        }

        metadataFile.packageName = this.projectSlug;
        metadataFile.projectName = this.projectName;

        try {

            await helpers.serializeJsonFile(metadataPath, metadataFile);

            this.result.push({ 'Status': CliStatus.SUCCESS, 'Message': 'Project metadata saved.' });
        } catch (err) {

            this.result.push({ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': 'Project metadata not saved.' });
        }
    }

    notifyServer() {

        const http = new HttpWrapper({
            port: config.port,
            hostname: config.host,
            path: '/packages/initialized',
            data: JSON.stringify({
                'projectName': this.args.projectName || this.projectSlug,
                'packageName': this.projectSlug
            }),
            headers: {
                ...this.authHeaders,
                'Content-Type': 'application/json'
            }
        });

        return http.post();
    }
}

module.exports = InitHandler;
