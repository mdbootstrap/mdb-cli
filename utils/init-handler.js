'use strict';

const fs = require('fs');
const path = require('path');

const AuthHandler = require('./auth-handler');
const prompt = require('inquirer').createPromptModule();
const removeFolder = require('../helpers/remove-folder');
const { showConfirmationPrompt } = require('../helpers/show-confirmation-prompt');

const INIT_ARGS_MAP = {
    '-n': 'projectName'
};

class InitHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.cwd = process.cwd();
        this.projectSlug = '';
        this.projectRoot = '';
        this.args = {
            projectName: null
        };

        this.authHeaders = {};
        this._promptShownCount = 0;

        this.authHandler = authHandler;

        this.setAuthHeader();
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.authHeaders = this.authHandler.headers;
    }

    getAvailableOptions() {

        const { fetchProducts } = require('../helpers/fetch-products');

        return fetchProducts(this.authHeaders)
            .then((orders) => {

                const getSorted = require('../helpers/get-sorted-product');

                orders = typeof orders === 'string' ? JSON.parse(orders) : orders;
                this.result = getSorted(orders, 'product_title');
            })
    }

    parseArgs(args) {

        for (let i = 0; i <= args.length - 2; i += 2) {

            const arg = args[i];
            const argVal = args[i + 1];
            this.args[INIT_ARGS_MAP[arg]] = argVal;
        }
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
        .then((select) => this.handleUserProjectSelect(select));
    }

    initProject() {

        const project = this.result.find((row) => row.product_slug === this.projectSlug);

        const isFreePackage = project.product_id === null;

        const filePath = path.join(this.cwd, 'package.json');
        let shouldShowConfirmationPrompt;

        try {

            fs.accessSync(filePath, fs.F_OK);
            shouldShowConfirmationPrompt = true;
        } 
        catch (err) {
            
            shouldShowConfirmationPrompt = false;
        } 
        finally {

            if (shouldShowConfirmationPrompt) {

                showConfirmationPrompt('There is already an npm project in this location, are you sure you want to init it in this location?')
                    .then(answer => {
				    
                        if (answer) this.download(isFreePackage);
                    });
            } else {

                this.download(isFreePackage);
            }
        }
    }

    download(isFreePackage) {

        let initProject;
        if (isFreePackage) {

            const { gitClone } = require('../helpers/git-clone');
            initProject = gitClone(`https://github.com/mdbootstrap/${this.projectSlug}.git`, this.args.projectName);
            this.projectRoot = path.join(this.cwd, this.projectSlug);
        } else {

            const setPackageName = require('../helpers/get-project-name');
            const { downloadProStarter } = require('../helpers/download-pro-starter');
            const longName = setPackageName(this.projectSlug.slice(0, this.projectSlug.indexOf('-')));

            initProject = downloadProStarter(longName, this.authHeaders, this.cwd);
            this.projectRoot = path.join(this.cwd, longName);
        }

        console.log('Initializing...');
        
        initProject
            .then(result => {
            
                this.result = result;
                const gitPath = path.join(this.projectRoot, '.git');
                removeFolder(gitPath);
                this._handleProjectInitialized().then(() => console.table(this.result));
            })
            .catch(error => Array.isArray(error) ? console.table(error) : console.log(error));
    }

    _handleProjectInitialized() {

        const fs = require('fs');
        const path = require('path');
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {

            const { createPackageJson } = require('../helpers/create-package-json');
            return createPackageJson(this.projectRoot)
                .then(confirmed => {

                    if (confirmed) {

                        this.result.push({ 'Status': 0, 'Message': 'package.json created.' })
                        return Promise.resolve();
                    }
                })
                .catch(error => {
    
                    if (error) {
    
                        this.result.push({ 'Status': 'project init error', 'Message': 'package.json not created. Try to run npm init in project folder.' })
                        return Promise.reject(error);
                    }
                });
        }

        return Promise.resolve();
    }

    handleUserProjectSelect(select) {

        if (this._promptShownCount++ >= 10) {

            this.result = [{ 'Status': 'suggestion', 'Message': 'Please run `mdb list` to see available packages.' }];

            console.table(this.result);

            process.exit(0);
        }

        const { projectSlug } = select;
        const project = this.result.find((row) => row.product_slug === projectSlug);

        if (!project.available) {

            console.log(`You cannot create this project. Please visit https://mdbootstrap.com/products/${project.product_slug}/ and make sure it is available for you.`);

            return this.showUserPrompt();
        }

        this.projectSlug = projectSlug;
    }

}

module.exports = InitHandler;
