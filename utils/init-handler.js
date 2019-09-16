'use strict';

const AuthHandler = require('./auth-handler');
const helpers = require('../helpers/');
const fs = require('fs');
const path = require('path');
const prompt = require('inquirer').createPromptModule();

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

        this.args = { ...this.args, ...args};
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.authHeaders = this.authHandler.headers;
    }

    getAvailableOptions() {

        return helpers.fetchProducts(this.authHeaders)
            .then((orders) => {

                orders = typeof orders === 'string' ? JSON.parse(orders) : orders;
                this.result = helpers.getSorted(orders, 'product_title');
            });
    }

    showUserPrompt() {

        const choices = this.result.map((row) => ({
            name: row.product_title,
            short: row.product_slug,
            value: row.product_slug
        }));
        return prompt([
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

        const filePath = path.join(this.cwd, 'package.json');

        fs.exists(filePath, (err) => {

            if (err) {

                helpers.showConfirmationPrompt('There is already an npm project in this location, are you sure you want to init it in this location?')
                    .then(answer => {

                        if (answer) this._download();
                    });
            } else {

                this._download();
            }
        });
    }

    _setProjectInfo(project) {

        const { product_slug } = project;
        this.isFreePackage = project.product_id === null;

        if (this.isFreePackage) {

            this.projectSlug = product_slug.indexOf('React') === -1 ? product_slug : 'React-Template';
        } else {

            this.projectSlug = helpers.getPackageName(product_slug.slice(0, product_slug.indexOf('-')));
        }

        this.projectName = this.args.projectName ? this.args.projectName : this.projectSlug;
        this.projectRoot = path.join(this.cwd, this.projectName);
    }

    _download() {

        let initProject;

        return helpers.eraseProjectDirectories(this.projectSlug, this.projectName).then(() => {

            if (this.isFreePackage) {

                initProject = helpers.gitClone(`https://github.com/mdbootstrap/${this.projectSlug}.git`, this.projectName);
            } else {

                initProject = helpers.downloadProStarter(this.projectSlug, this.authHeaders, this.cwd, this.projectName);
            }

            initProject.then(result => {

                this.result = result;
                this.removeGitFolder()
                    .then(() => this.saveMetadata())
                    .then(() => this.notifyServer())
                    .then(() => console.table(this.result))
                    .catch(console.error);
            });
        });
    }

    removeGitFolder() {

        const gitPath = path.join(this.projectRoot, '.git');

        return helpers.removeFolder(gitPath);
    }

    _handleUserProjectSelect(select) {

        if (this._promptShownCount++ >= 10) {

            console.table([{ 'Status': 'suggestion', 'Message': 'Please run `mdb list` to see available packages.' }]);

            process.exit(0);
        }

        const { projectSlug } = select;
        const project = this.result.find((row) => row.product_slug === projectSlug);

        if (!project.available) {

            console.log(`You cannot create this project. Please visit https://mdbootstrap.com/products/${project.product_slug}/ and make sure it is available for you.`);

            return this.showUserPrompt();
        }

        this._setProjectInfo(project);
    }

    saveMetadata() {

        const { serializeJsonFile } = require('../helpers/serialize-object-to-file');
        const metadataPath = path.join(this.projectRoot, '.mdb');

        return new Promise(resolve =>

            serializeJsonFile(metadataPath, { packageName: this.projectSlug }).then(() => {

                this.result.push({'Status': 0, 'Message': 'Project metadata saved.'});
                resolve();
            }, () => resolve())
        );
    }

    notifyServer() {

        const HttpWrapper = require('../utils/http-wrapper');
        const config = require('../config');
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
