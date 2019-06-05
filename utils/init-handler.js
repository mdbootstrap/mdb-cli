'use strict';
const path = require('path');
const { spawn } = require('child_process');

const HttpWrapper = require('../utils/http-wrapper');
const AuthHandler = require('./auth-handler');
const prompt = require('inquirer').createPromptModule();
const config = require('../config');
const getSorted = require('../helpers/get-sorted-products');
const removeFolder = require('./../helpers/remove-folder');

const INIT_ARGS_MAP = {
    '-n': 'projectName'
};

class InitHandler {

    constructor() {

        this.result = [];
        this.cwd = process.cwd();
        this.projectSlug = '';
        this.packageName = '';
        this.archiveEntries = [];
        this.progressBarOptions = {
            complete: '=',
            incomplete: ' ',
            width: 100,
            total: 0
        };
        this.args = {
            projectName: null
        };

        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/packages/read',
            method: 'GET',
            data: ''
        };
        this._promptShownCount = 0;

        this.authHandler = new AuthHandler();

        this.setAuthHeader();
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.options.headers = this.authHandler.headers;
    }

    setProjectPath() {

        this.cwd += `/${this.getProjectName()}`;

        this.setEntriesProjectDir();
    }

    setEntriesProjectDir() {

        const [{path: entryPath}] = this.archiveEntries;
        const [dirname] = entryPath.split('/');
        this.archiveEntries = this.archiveEntries.map(e => {
            e.path = e.path.replace(`${dirname}/`, '');
            return e;
        });
    }

    _setPackageName(technology) {

        switch (technology) {
            case 'jquery':
                this.packageName = 'MDB-Pro';
                break;
            case 'angular':
                this.packageName = 'ng-uikit-pro-standard';
                break;
            case 'react':
                this.packageName = 'MDB-React-Pro-npm';
                break;
            case 'vue':
                this.packageName = 'MDB-Vue-Pro';
                break;
        }
    }

    getAvailableOptions() {

        const http = new HttpWrapper(this.options);
        return http.get()
            .then((orders) => {

                orders = typeof orders === 'string' ? JSON.parse(orders) : orders;
                this.result = getSorted(orders, 'product_title');

            }, (error) => {

                throw error;
            })
    }

    getProjectName() {

        return this.args.projectName || this.packageName;
    }

    parseArgs(args) {

        for (let i = 0; i <= args.length - 2; i += 2) {

            const arg = args[i];
            const argVal = args[i+1];
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
            .then((selection) => {

                if (this._promptShownCount++ >= 10) {

                    this.result = [{ 'Status': 'suggestion', 'Message': 'Please run `mdb list` to see available packages.' }];

                    console.table(this.result);

                    process.exit(0);
                    return;
                }

                const { projectSlug } = selection;
                const project = this.result.find((row) => row.product_slug === projectSlug);

                if (!project || !project.available) {

                    console.log(`You cannot create this project. Please visit https://mdbootstrap.com/products/${project.product_slug}/ and make sure it is available for you.`);

                    return this.showUserPrompt();
                }

                this.projectSlug = projectSlug;
            });
    }

    initProject() {

        const project = this.result.find((row) => row.product_slug === this.projectSlug);

        const isFreePackage = project.product_id === null;
        let initProject;

        if (isFreePackage) {

            initProject = this._gitClone(`https://github.com/mdbootstrap/${this.projectSlug}.git`);
        } else {

            const longName = this.projectSlug.slice(0, this.projectSlug.indexOf('-'));
            initProject = this._downloadProStarter(longName);
        }

        console.log('Initializing...');

        initProject.then(
            result => {

                const gitPath = path.join(this.cwd, this.projectSlug, '.git');
                removeFolder(gitPath);
                this._handleProjectInitialized(result)
            },
            error => Array.isArray(error) ? console.table(error) : console.log(error));
    }

    _handleProjectInitialized(result) {

        this.result = result;
        const fs = require('fs');
        const path = require('path');
        const projectRoot = path.join(this.cwd, this.projectSlug);
        const packageJsonPath = path.join(projectRoot, 'package.json');

        if (!fs.existsSync(packageJsonPath)) {

            this._createPackageJson(projectRoot);
        } else {

            console.table(this.result);
        }

    }

    _createPackageJson(directoryPath) {

        const { _askCreatePackageJson } = require('./publish-handler');

        _askCreatePackageJson().then(confirmed => {

            if (confirmed) {

                const isWindows = process.platform === 'win32';
                const npmInit = spawn('npm', ['init', '--yes'], { cwd: directoryPath, ...(isWindows && { shell: true }) });

                npmInit.on('error', console.log);

                npmInit.on('exit', (code) => {

                    if (code === 0) {

                        this.result.push({'Status': code, 'Message': 'package.json created.'});
                    } else {

                        this.result.push({'Status': code, 'Message': 'There were some errors with package.json initializing. Please try again or create it with \'npm init\' command in project root folder.'});
                    }

                    console.table(this.result);
                });
            }
        });
    }

    _gitClone(repoUrl) {

        return new Promise((resolve, reject) => {
            
            const gitArgs = !!this.args.projectName ? ['clone', repoUrl, this.args.projectName] : ['clone', repoUrl];
            const isWindows = process.platform === 'win32';
            const gitClone = spawn('git', gitArgs, { ...(isWindows && { shell: true }) });

            gitClone.stdout.on('data', (data) => {

                console.log(Buffer.from(data).toString());
            });
            gitClone.stderr.on('data', (error) => {

                console.log(Buffer.from(error).toString());
            });
            gitClone.on('error', console.log);
            gitClone.on('exit', (code) => {

                if (code === 0) {

                    this.result = [{ 'Status': code, 'Message': 'Initialization completed.' }];
                    resolve(this.result);
                } else {

                    this.result = [{ 'Status': code, 'Message': 'There were some errors. Please try again.' }];
                    reject(this.result);
                }
            });
        });
    }

    _downloadProStarter(technology) {

        return new Promise((resolve, reject) => {

            this._setPackageName(technology);

            const http = new HttpWrapper({
                port: config.port,
                hostname: config.host,
                path: `/packages/download/${this.packageName}`,
                method: 'GET',
                data: '',
                headers: this.options.headers
            });

            const request = http.createRequest((response) => {

                const unzip = require('unzipper');
                const ProgressBar = require('progress');

                const { Readable } = require('stream');

                const readStream = new Readable();

                readStream._read = () => { };

                try {

                    readStream.pipe(unzip.Extract({ path: `${this.cwd}` }));
                } catch (e) {

                    console.log(e);

                    this.result = [{ 'Status': 'error', 'Message': 'Error initializing your project' }];

                    reject(this.result);
                }

                let len = Number(response.headers['content-length']);

                const bar = new ProgressBar('[:bar] :eta s', {

                    complete: '=',
                    incomplete: ' ',
                    width: 100,
                    total: len
                });

                response.on('data', (chunk) => {

                    readStream.push(chunk);
                    bar.tick(chunk.length);
                });

                response.on('end', () => {

                    readStream.push(null);

                    console.log('\n');

                    this.result = [{ 'Status': 'initialized', 'Message': 'Initialization completed.' }];

                    resolve(this.result);
                })
            });

            request.on('error', reject);
            request.write('');
            request.end();
        });
    }
    
}

module.exports = InitHandler;
