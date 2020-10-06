'use strict';

const fs = require('fs');
const Ora = require('ora');
const path = require('path');
const atob = require('atob');
const fse = require('fs-extra');
const config = require('../config');
const helpers = require('../helpers');
const childProcess = require('child_process');
const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const HttpWrapper = require('../utils/http-wrapper');
const loadPackageManager = require('./managers/load-package-manager');

class PublishHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.cwd = process.cwd();
        this.projectName = '';
        this.packageName = '';
        this.domainName = '';
        this.last = 0;
        this.sent = 0;
        this.endMsg = '';
        this.useFtp = false;
        this.test = false;
        this.useGitlab = false;
        this.currentBranch = '';
        this.packageManager = null;
        this.isWindows = process.platform === 'win32';
        this.backendTechnology = undefined;

        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/project/publish',
            method: 'POST'
        };

        this.authHandler = authHandler;

        this.setAuthHeader();
    }

    setAuthHeader() {

        this.result = this.authHandler.result;
        this.options.headers = this.authHandler.headers;
    }

    getResult() {

        return this.result;
    }

    async setArgs(args) {

        this.useFtp = args.some(arg => arg === '--ftp');
        this.test = args.some(arg => ['-t', '--test'].includes(arg));
        const backendTechnology = args.find(arg => ['-b', '--backend'].includes(arg.split('=')[0]));
        this.backendTechnology = backendTechnology ? backendTechnology.split('=')[1] : undefined;

        const technologies = config.backendTechnologies;

        if (backendTechnology && !technologies.includes(this.backendTechnology)) {

            return Promise.reject({ Status: CliStatus.CLI_ERROR, Message: `This technology is not supported. Allowed technologies: ${technologies.join(', ')}` });
        }
    }

    handlePublishArgs() {

        if (this.useFtp) return Promise.resolve();

        return this.getSavedSettings().then(() => this.checkIsGitlab());
    }

    async getSavedSettings() {

        const settingsPath = path.join(this.cwd, '.mdb');

        try {

            const settings = await helpers.deserializeJsonFile(settingsPath);

            if (settings.useGitlab) {

                this.useGitlab = true;
            }

        } catch (err) {

            if (err.toString().toLowerCase().indexOf('unexpected token') !== -1) {

                return Promise.reject({ Status: CliStatus.CLI_ERROR, Message: '.mdb file is invalid. Please remove it and try again.' });
            }
        }
    }

    async checkIsGitlab() {

        const configPath = path.join(this.cwd, '.git', 'config');
        const configContent = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';
        const lines = configContent.replace(/\t/g, '').split('\n');
        const remoteUrls = [];

        lines.forEach((line, index) => {

            if (line.startsWith('[remote')) {

                const url = lines[index + 1].split(' = ')[1];

                if (url.startsWith(config.gitlabUrl)) this.repoUrl = url;

                remoteUrls.push(url);
            }
        });

        if (this.repoUrl) {

            if (this.useGitlab) return;

            const useGitlab = await helpers.showConfirmationPrompt(
                'This project seems to be created on MDB Go GitLab server. Do you want to use our pipeline to publish your project now?'
            );

            if (useGitlab === false) this.useFtp = true;

        } else {

            this.useFtp = true;
        }
    }

    publish() {

        if (this.backendTechnology) {
            console.log('\n\x1b[34m%s\x1b[0m', 'Note:', 'In order for your app to run properly you need to configure it so that it listens on port 3000. It is required for internal port mapping. The real port that your app is available at, will be provided to you after successful publish.\n');
        }

        return this.useFtp ? this.uploadToFtp() : this.useGitlabPipeline();
    }

    uploadToFtp() {

        return this.setPackageName()
            .then(() => this.buildProject())
            .then(() => this.uploadFiles());
    }

    useGitlabPipeline() {

        return this.getProjectStatus()
            .then(() => this.getCurrentBranch())
            .then(() => this.askAboutMerge())
            .then(() => this.pullFromGitlab())
            .then(() => this.createJenkinsfile())
            .then(() => this.pushToGitlab())
            .then(() => this.askAboutSaveSettings());
    }

    getProjectStatus() {

        return new Promise((resolve, reject) => {

            const gitStatus = childProcess.spawn('git', ['status'], { cwd: this.cwd, ...(this.isWindows && { shell: true }) });

            gitStatus.stdout.on('data', (data) => {

                if (data.indexOf('nothing to commit, working tree clean') !== -1) {

                    return resolve({ Status: CliStatus.SUCCESS, Message: 'OK' });

                }

                return reject({ Status: CliStatus.CLI_ERROR, Message: 'You have uncommited changes in your project, please commit and try again.' });
            });

            gitStatus.stderr.on('data', (data) => {

                return reject(data.toString());
            });
        });
    }

    getCurrentBranch() {

        return new Promise((resolve, reject) => {

            const gitBranch = childProcess.spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'],
                { cwd: this.cwd, ...(this.isWindows && { shell: true }) });

            gitBranch.stdout.on('data', (data) => {

                this.currentBranch = data.toString().trim();

                return resolve();
            });

            gitBranch.stderr.on('data', (data) => {

                return reject(data.toString());
            });
        });
    }

    async askAboutMerge() {

        if (this.currentBranch === 'master') return;

        const answer = await helpers.showConfirmationPrompt(`Your currenct branch is ${this.currentBranch}. Do you want to merge it into master?`);

        if (answer) {

            await this.changeBranch();

            await this.mergeBranch();

        } else {

            process.exit(0);
        }
    }

    changeBranch() {

        return new Promise((resolve, reject) => {

            const gitCheckout = childProcess.spawn('git', ['checkout', 'master'],
                { cwd: process.cwd(), stdio: 'inherit', ...(this.isWindows && { shell: true }) });

            gitCheckout.on('error', error => reject(error));

            gitCheckout.on('exit', code => {

                if (code === CliStatus.SUCCESS) {

                    this.result.push({ Status: CliStatus.SUCCESS, Message: 'Switched to branch master.' });

                    return resolve();
                }

                return reject({ Status: code, Message: 'Problem with git branch change.' });
            });
        });
    }

    mergeBranch() {

        return new Promise((resolve, reject) => {

            const gitMerge = childProcess.spawn('git', ['merge', this.currentBranch],
                { cwd: process.cwd(), stdio: 'inherit', ...(this.isWindows && { shell: true }) });

            gitMerge.on('error', error => reject(error));

            gitMerge.on('exit', code => {

                if (code === CliStatus.SUCCESS) {

                    this.result.push({ Status: CliStatus.SUCCESS, Message: `Branch ${this.currentBranch} merged into master` });

                    return resolve();
                }

                return reject({ Status: code, Message: 'Problem with git branch merge.' });
            });
        });
    }

    pullFromGitlab() {

        return new Promise((resolve, reject) => {

            const gitPull = childProcess.spawn('git', ['pull', 'origin', 'master'], {
                cwd: process.cwd(), ...this.isWindows && { shell: true }
            });

            let result;

            gitPull.stdout.on('data', (data) => {

                result = `\n${data}`;
                console.log(result);
            });

            gitPull.stderr.on('data', (data) => {

                result = `\n${data}`;
                console.error(result);
            });

            gitPull.on('exit', (code) => {

                if (code === CliStatus.SUCCESS || result.indexOf("Couldn't find remote ref master") !== -1) resolve();

                else reject({ Status: code, Message: 'Problem with project fetching from GitLab.' });
            });
        });
    }

    async createJenkinsfile() {

        const created = await helpers.createJenkinsfile(this.cwd);

        created && await helpers.commitFile('Jenkinsfile', 'Add Jenkinsfile');
    }

    pushToGitlab() {

        return new Promise((resolve, reject) => {

            const gitPush = childProcess.spawn('git', ['push', 'origin', 'master'],
                { cwd: process.cwd(), stdio: 'inherit', ...this.isWindows && { shell: true } });

            gitPush.on('error', error => reject(error));

            gitPush.on('exit', code => {

                if (code === CliStatus.SUCCESS) {

                    this.result.push({ Status: code, Message: 'Success! Your project will be published using GitLab pipeline' });

                    const options = {
                        port: config.port,
                        hostname: config.host,
                        path: `/project/save/${this.projectName}`,
                        method: 'POST',
                        data: { repoUrl: this.repoUrl },
                        headers: {
                            ...this.authHandler.headers,
                            'Content-Type': 'application/json'
                        }
                    };

                    const http = new HttpWrapper(options);

                    return http.post().then((res) => {

                        this.result.push(JSON.parse(res));

                        return resolve();

                    }).catch((err) => {

                        return reject(err);
                    });
                }

                return reject({ Status: code, Message: 'Problem with project publishing.' });
            });
        });
    }

    async askAboutSaveSettings() {

        if (this.useGitlab === false) {

            const save = await helpers.showConfirmationPrompt('Do you want to use GitLab pipelines as a default publish method?');

            if (save) this.saveSettings();
            else this.result = [{
                Status: CliStatus.SUCCESS,
                Message: 'Success! This time your project will be published using GitLab pipeline but we will not use it next time.'
            }];
        }
    }

    async saveSettings() {

        const settingsPath = path.join(this.cwd, '.mdb');

        try {

            const settings = await helpers.deserializeJsonFile(settingsPath);

            settings.useGitlab = true;
            await helpers.serializeJsonFile(settingsPath, settings);
            await helpers.commitFile('.mdb', 'Add settings to .mdb config file');
        }
        catch (err) {

            if (err.code === 'ENOENT') {

                helpers.saveMdbConfig(settingsPath, JSON.stringify({ useGitlab: true }), true);
            }
        }
    }

    async loadPackageManager() {

        if (this.isBackendOneOf('php')) return;

        if (this.packageManager === null) {

            this.packageManager = await loadPackageManager(true, !this.useFtp);
        }
    }

    async runTests() {

        if (this.test) {

            await this.loadPackageManager();

            return new Promise((resolve, reject) => {

                const test = this.packageManager.test();

                test.on('error', error => reject(error));

                test.on('exit', code => code === CliStatus.SUCCESS ?
                    resolve({ Status: code, Message: 'Success' }) : reject({ Status: code, Message: 'Tests failed' }));
            });

        } else {

            return Promise.resolve();
        }
    }

    async setProjectName() {

        const packageJsonPath = path.join(this.cwd, 'package.json');

        try {

            const packageJson = await helpers.deserializeJsonFile(packageJsonPath);
            this.projectName = packageJson.name;
            this.domainName = packageJson.domainName || '';

            return Promise.resolve();

        } catch (e) {

            if (e.code && e.code === 'ENOENT' && !this.isBackendOneOf('php')) {

                return this.handleMissingPackageJson();
            }
            else if (this.isBackendOneOf('php')) {

                await this.setPhpProjectName();

                return;
            }

            this.result = [{ Status: CliStatus.INTERNAL_SERVER_ERROR, Message: `Problem with reading project name: ${e}` }];
            return Promise.reject(this.result);
        }
    }

    isBackendOneOf(tech) {

        return !!this.backendTechnology && this.backendTechnology.includes(tech);
    }

    async setPhpProjectName() {

        const metadataPath = path.join(this.cwd, '.mdb');
        const metadataExists = fs.existsSync(metadataPath);

        const projectMetadata = metadataExists ? await helpers.deserializeJsonFile(metadataPath) : {};

        if (projectMetadata.projectName) {

            this.projectName = projectMetadata.projectName;

            return;
        }

        const name = await helpers.showTextPrompt('Enter project name', 'Project name must not be empty.');

        this.projectName = name;

        if (metadataExists) {

            projectMetadata.projectName = name;

            await helpers.serializeJsonFile(metadataPath, projectMetadata);
        }
        else {

            fs.writeFileSync(metadataPath, JSON.stringify({ projectName: name }), 'utf8');
        }
    }

    async setPackageName() {

        const metadataPath = path.join(this.cwd, '.mdb');

        try {

            const projectMetadata = await helpers.deserializeJsonFile(metadataPath);
            this.packageName = projectMetadata.packageName || '';

        } catch (e) {

            this.packageName = '';
        }
    }

    async buildProject() {

        const distPath = path.join(this.cwd, 'dist');
        const buildPath = path.join(this.cwd, 'build');
        const packageJsonPath = path.join(this.cwd, 'package.json');
        let packageJson = fs.existsSync(packageJsonPath) ? await helpers.deserializeJsonFile(packageJsonPath) : {};

        if (packageJson.scripts && packageJson.scripts.build) {

            const isAngular = packageJson.dependencies && !!packageJson.dependencies['@angular/core'];
            const isReact = packageJson.dependencies && !!packageJson.dependencies.react;
            const isVue = packageJson.dependencies && !!packageJson.dependencies.vue;

            await this.loadPackageManager();

            if (isAngular) {

                const angularJsonPath = path.join(this.cwd, 'angular.json');
                const angularJson = await helpers.deserializeJsonFile(angularJsonPath);

                await helpers.buildProject(this.packageManager);

                const angularFolder = path.join('dist', angularJson.defaultProject);
                const indexPath = path.join(this.cwd, angularFolder, 'index.html');
                let indexHtml = fs.readFileSync(indexPath, 'utf8');
                indexHtml = indexHtml.replace(/<base href="\/">/g, '<base href=".">');
                fs.writeFileSync(indexPath, indexHtml, 'utf8');

                const toRename = path.join(this.cwd, angularFolder);

                fse.moveSync(toRename, buildPath, { overwrite: true });
                fse.moveSync(buildPath, distPath, { overwrite: true });

            } else if (isReact) {

                const token = this.authHandler.headers.Authorization;
                const [, jwtBody] = token.split('.');
                const username = JSON.parse(atob(jwtBody)).name;

                const appJsPath = path.join(this.cwd, 'src', 'App.js');

                if (fs.existsSync(appJsPath)) {

                    let appJsFile = fs.readFileSync(appJsPath, 'utf8');
                    appJsFile = appJsFile.replace(/<Router/g, `<Router basename='/${username}/${packageJson.name}'`);
                    fs.writeFileSync(appJsPath, appJsFile, 'utf8');
                }

                packageJson.homepage = `${config.projectsDomain}/${username}/${packageJson.name}/`;
                await helpers.serializeJsonFile('package.json', packageJson);

                await helpers.buildProject(this.packageManager);

                if (fs.existsSync(appJsPath)) {

                    let appJsFile = fs.readFileSync(appJsPath, 'utf8');
                    const regex = new RegExp(`<Router basename='/${username}/${packageJson.name}'`, 'g');
                    appJsFile = appJsFile.replace(regex, '<Router');
                    fs.writeFileSync(appJsPath, appJsFile, 'utf8');
                }

                packageJson = await helpers.deserializeJsonFile(packageJsonPath);
                delete packageJson.homepage;
                await helpers.serializeJsonFile('package.json', packageJson);

            } else if (isVue) {

                const vueConfigFile = path.join(this.cwd, 'vue.config.js');

                if (!fs.existsSync(vueConfigFile)) {

                    const vueConfigContent = 'module.exports = { publicPath: \'.\' }';

                    fs.writeFileSync(vueConfigFile, vueConfigContent, 'utf8');
                }

                await helpers.buildProject(this.packageManager);

            } else {

                await helpers.buildProject(this.packageManager);

                const warning = `
This is not MDB JARV project and there is no guarantee that it will work properly after publishing.
In case of problems, please write to our support https://mdbootstrap.com/support/
`;
                console.log('\x1b[36m%s\x1b[0m', warning);

                if (!fs.existsSync(distPath) && !fs.existsSync(buildPath)) {
                    return Promise.reject({ Status: CliStatus.ERROR, Message: 'Build folder not found.' });
                }
            }
        }
    }

    uploadFiles() {

        console.log('Publishing...');

        const spinner = new Ora({
            text: 'Uploading files'
        });

        spinner.start();

        return new Promise((resolve, reject) => {

            if (this.backendTechnology) this.options.headers['x-mdb-cli-backend-technology'] = this.backendTechnology;
            this.options.headers['x-mdb-cli-project-name'] = this.projectName;
            this.options.headers['x-mdb-cli-package-name'] = this.packageName;
            this.options.headers['x-mdb-cli-domain-name'] = this.domainName;
            const { archiveProject } = require('../helpers/archiver-wrapper');
            const archive = archiveProject('zip', { zlib: { level: 9 } });
            const http = new HttpWrapper(this.options);

            const request = http.createRequest(response => {

                response.on('data', (data) => {

                    this.endMsg = Buffer.from(data).toString('utf8');
                });

                response.on('end', () => {

                    this.convertToMb(archive.pointer());

                    spinner.succeed(`Uploading files | ${this.sent} Mb`);

                    this.result.push({ 'Status': response.statusCode, 'Message': this.endMsg });

                    if (response.statusCode === CliStatus.HTTP_SUCCESS) {

                        this.result.push({ 'Status': CliStatus.SUCCESS, 'Message': `Sent ${this.sent} Mb` });
                    } else {

                        this.result.push({ 'Status': response.statusCode, 'Message': response.statusMessage });
                    }

                    resolve();
                });

                response.on('error', console.error);
            });

            archive.on('error', reject);

            archive.on('warning', console.warn);

            archive.on('progress', () => {

                this.convertToMb(archive.pointer());

                spinner.text = `Uploading files | ${this.sent} Mb`;
            });

            archive.pipe(request);

            archive.glob('**', {
                cwd: this.cwd,
                ignore: ['node_modules/**', '.git/**', '.gitignore', 'Dockerfile', '.dockerignore', '.idea/**']
            });

            archive.finalize();
        });
    }

    convertToMb(pointer) {

        const num = pointer / Math.pow(1024, 2);
        this.sent = num.toFixed(3);
    }

    handleMissingPackageJson() {

        return this.loadPackageManager()
            .then(() => helpers.createPackageJson(this.packageManager, this.cwd))
            .then(msg => this.result.push(msg))
            .then(() => this.setProjectName())
            .catch(err => {

                this.result.push(err);
                this.result.push({ 'Status': CliStatus.ERROR, 'Message': 'Missing package.json file.' });

                console.table(this.result);
                process.exit(1);
            });
    }
}

module.exports = PublishHandler;
