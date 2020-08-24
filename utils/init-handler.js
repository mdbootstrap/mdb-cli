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
        choices.push({ name: 'Blank projct', short: 'blank', value: 'blank' });

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

    _setProjectInfo(project) {

        const { productSlug } = project;
        this.isFreePackage = project.productId === null;

        this.projectSlug = productSlug;

        this.projectName = this.args.projectName ? this.args.projectName : this.projectSlug;
        this.projectRoot = path.join(this.cwd, this.projectName);
    }

    _initEmptyProject() {

        return this.askForProjectName()
            .then(() => helpers.eraseProjectDirectories(this.projectSlug, this.projectName))
            .then(() => this.createDirectory())
            .then(() => this.loadPackageManager())
            .then(() => this.createPackageJson())
            .then(res => this.result = [res])
            .catch(err => this.result = [err]);
    }

    askForProjectName() {

        if (this.args.projectName) {

            this.projectName = this.args.projectName;
            return Promise.resolve();
        }

        return helpers.showTextPrompt('Enter project name', 'Project name must not be empty.')
            .then(answer => this.projectName = answer);
    }

    createDirectory() {

        const dirPath = path.join(this.cwd, this.projectName);

        return new Promise((resolve, reject) => {

            fs.mkdir(dirPath, err => {
    
                if (err) {
    
                    return reject({ Status: CliStatus.ERROR, Message: `Error: ${err}` });
                }
    
                resolve();
            });
        });
    }

    async loadPackageManager() {

        this.packageManager = await loadPackageManager();
    }

    createPackageJson() {

        return new Promise((resolve, reject) => {

            const init = this.packageManager.init(path.join(this.cwd, this.projectName));

            init.on('error', (error) => reject({ Status: CliStatus.ERROR, Message: error.message }));

            init.on('exit', (code) => code === CliStatus.SUCCESS ?
                resolve({ Status: CliStatus.SUCCESS, Message: `Project ${this.projectName} successfully created` }) :
                reject({ Status: code, Message: 'Problem with npm initialization' }));
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

            this.args.blank = true;

            return Promise.resolve();
        }

        const project = this.options.find((row) => row.productSlug === projectSlug);

        if (!project.available) {

            console.log(`You cannot create this project. Please visit https://mdbootstrap.com/products/${project.productSlug}/ and make sure it is available for you.`);

            return this.showUserPrompt();
        }

        this._setProjectInfo(project);
    }

    saveMetadata() {

        const metadataPath = path.join(this.projectRoot, '.mdb');

        return new Promise((resolve) =>

            helpers.serializeJsonFile(metadataPath, { packageName: this.projectSlug })
                .then(() => {

                    this.result.push({ 'Status': CliStatus.SUCCESS, 'Message': 'Project metadata saved.' });
                    resolve();
                })
                .catch(() => {

                    this.result.push({ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': 'Project metadata not saved.' });
                    resolve();
                }));
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
