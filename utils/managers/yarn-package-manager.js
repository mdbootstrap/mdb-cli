'use strict';

const PackageManager = require('./package-manager');
const childProcess = require('child_process');

class YarnPackageManager extends PackageManager {

    info() {

        return childProcess.spawn('yarn', ['info', 'mdb-cli', 'version'], { stdio: 'inherit', ...(this.isWindows && { shell: true }) });
    }

    init(cwd) {

        return childProcess.spawn('yarn', ['init'], { cwd, stdio: 'inherit', ...(this.isWindows && { shell: true }) });
    }

    build(cwd) {

        return childProcess.spawn('yarn', ['build'], { cwd, stdio: 'inherit', ...(this.isWindows && { shell: true }) });
    }

    test() {

        return childProcess.spawn('yarn', ['test'], { stdio: 'inherit', ...(this.isWindows && { shell: true }) });
    }

    update() {

        return childProcess.spawn('yarn', ['global', 'add', 'mdb-cli'], { stdio: 'inherit', ...(this.isWindows && { shell: true }) });
    }
}

module.exports = YarnPackageManager;
