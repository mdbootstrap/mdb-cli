'use strict';

const HttpWrapper = require('../utils/http-wrapper');
const AuthHandler = require('./auth-handler');
const prompt = require('inquirer').createPromptModule();
const { spawn } = require('child_process');

const config = require('../config');

const getSorted = require('../helpers/get-sorted-products');

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
            })
            .catch(console.error)
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
        if (isFreePackage) {

            this._gitClone(`https://github.com/mdbootstrap/${this.projectSlug}.git`);
        } else {

            const longName = this.projectSlug.slice(0, this.projectSlug.indexOf('-'));
            this._downloadProStarter(longName);
        }

        console.log('Initializing...');
    }

    _gitClone(repoUrl) {

        const gitArgs = !!this.args.projectName ? ['clone', repoUrl, this.args.projectName] : ['clone', repoUrl];
        const gitClone = spawn('git', gitArgs);

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
            } else {

                this.result = [{ 'Status': code, 'Message': 'There were some errors. Please try again.' }];
            }

            console.table(this.result);
        });
    }

    _downloadProStarter(technology) {

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

                console.table(this.result);

                process.exit(1);
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

                console.table(this.result);
            })
        });

        request.on('error', console.log);
        request.write('');
        request.end();
    }
}

module.exports = InitHandler;
