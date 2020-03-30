'use strict';

const AuthHandler = require('./auth-handler');
const helpers = require('../helpers/');
const CliStatus = require('../models/cli-status');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const HttpWrapper = require('../utils/http-wrapper');
const config = require('../config');

class InitHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.cwd = process.cwd();
        this.projectSlug = '';
        this.projectRoot = '';
        this.authHeaders = {};
        this._promptShownCount = 0;
        this.authHandler = authHandler;
        this.args = { projectName: '' };
        this.isFreePackage = true;

        this.setAuthHeader();
    }

    setArgs(args) {

        this.args = { ...this.args, ...args };
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.authHeaders = this.authHandler.headers;
    }

    getAvailableOptions() {

        return helpers.fetchProducts(this.authHeaders)
            .then((orders) => {

                orders = typeof orders === 'string' ? JSON.parse(orders) : orders;
                this.result = helpers.getSorted(orders, 'productTitle');
            });
    }

    showUserPrompt() {

        const choices = this.result.map((row) => ({
            name: row.productTitle,
            short: row.productSlug,
            value: row.productSlug
        }));

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

            helpers.showConfirmationPrompt('There is already an npm project in this location, are you sure you want to init it here?')
                .then((confirmed) => {

                    if (confirmed) this._download();
                });
        } else {

            this._download();
        }
    }

    _setProjectInfo(project) {

        const { productSlug } = project;
        this.isFreePackage = project.productId === null;

        this.projectSlug = productSlug;

        this.projectName = this.args.projectName ? this.args.projectName : this.projectSlug;
        this.projectRoot = path.join(this.cwd, this.projectName);
    }

    _download() {

        return helpers.eraseProjectDirectories(this.projectSlug, this.projectName)
            .then(() => helpers.downloadProStarter(this.projectSlug, this.authHeaders, this.cwd, this.projectName))
            .then(result => {

                this.result = result;
                this.saveMetadata()
                    .then(() => this.notifyServer())
                    .catch(console.error)
                    .finally(() => console.table(this.result));

            }).catch(() => console.table([{ Status: 'OK', Message: 'OK, will not delete existing project.' }]));
    }

    _handleUserProjectSelect(select) {

        if (this._promptShownCount++ >= 10) {

            console.table([{ 'Status': CliStatus.SEE_OTHER, 'Message': 'Please run `mdb list` to see available packages.' }]);

            return process.exit(0);
        }

        const { projectSlug } = select;
        const project = this.result.find((row) => row.productSlug === projectSlug);

        if (!project.available) {

            console.log(`You cannot create this project. Please visit https://mdbootstrap.com/products/${project.productSlug}/ and make sure it is available for you.`);

            return this.showUserPrompt();
        }

        this._setProjectInfo(project);
    }

    saveMetadata() {

        const { serializeJsonFile } = require('../helpers/serialize-object-to-file');
        const metadataPath = path.join(this.projectRoot, '.mdb');

        return new Promise((resolve) =>

            serializeJsonFile(metadataPath, { packageName: this.projectSlug })
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
