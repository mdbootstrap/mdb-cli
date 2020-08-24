'use strict';

const PackageManager = require('./package-manager');
const childProcess = require('child_process');

class NpmPackageManager extends PackageManager {

    info() {

        return childProcess.spawn('npm', ['info', 'mdb-cli', 'version'], { stdio: 'inherit', ...(this.isWindows && { shell: true }) });
    }

    init(cwd) {

        return childProcess.spawn('npm', ['init'], { cwd, stdio: 'inherit', ...(this.isWindows && { shell: true }) });
    }

    build(cwd) {

        return childProcess.spawn('npm', ['run', 'build'], { cwd, stdio: 'inherit', ...(this.isWindows && { shell: true }) });
    }

    test() {

        return childProcess.spawn('npm', ['run', 'test'], { stdio: 'inherit', ...(this.isWindows && { shell: true }) });
    }

    update() {

        return childProcess.spawn('npm', ['i', '-g', 'mdb-cli'], { stdio: 'inherit', ...(this.isWindows && { shell: true }) });
    }
}

module.exports = NpmPackageManager;
