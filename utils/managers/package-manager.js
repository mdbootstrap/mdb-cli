'use strict';

const childProcess = require('child_process');
const CliStatus = require('../../models/cli-status');
const PackageManagers = require('../../models/package-managers');
const helpers = require('../../helpers');

class PackageManager {

    constructor() {

        this.isWindows = process.platform === 'win32';
    }

    get cmdCommand() {
        throw new Error('You must declare cmdCommand getter!');
    }

    static async load(manager) {

        const choices = [PackageManagers.NPM, PackageManagers.YARN];

        if (!manager) manager = await helpers.createListPrompt('Which package manager do you use?', choices);

        const NpmPackageManager = require('./npm-package-manager');
        const YarnPackageManager = require('./yarn-package-manager');

        switch (manager) {
            case PackageManagers.NPM: return new NpmPackageManager();
            case PackageManagers.YARN: return new YarnPackageManager();
        }
    }

    init() { throw new ReferenceError('Method must be implemented in a child-class'); }

    build() { throw new ReferenceError('Method must be implemented in a child-class'); }

    test() { throw new ReferenceError('Method must be implemented in a child-class'); }

    update() { throw new ReferenceError('Method must be implemented in a child-class'); }

    _task(args, successMsg, errorMsg, cwd) {

        return new Promise((resolve, reject) => {
            const task = childProcess.spawn(this.cmdCommand, args, { cwd, stdio: 'inherit', ...(this.isWindows && { shell: true }) });
            task.on('error', error => reject(error));
            task.on('exit', code => code === CliStatus.SUCCESS ? resolve(successMsg) : reject(errorMsg));
        });
    }
}

module.exports = PackageManager;
