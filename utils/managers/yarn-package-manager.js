'use strict';

const PackageManager = require('./package-manager');

class YarnPackageManager extends PackageManager {

    get cmdCommand() {
        return 'yarn';
    }

    init(cwd) {
        return this._task(['init'], 'package.json created. Proceeding...', 'package.json initialization failed', cwd);
    }

    build(cwd) {
        return this._task(['build'], 'Project built successfully', 'Project could not be built', cwd);
    }

    test() {
        return this._task(['test'], 'Tests ran successfully', 'Tests failed');
    }

    update() {
        return this._task(['global', 'add', 'mdb-cli'], 'Successfully updated', 'Update failed');
    }
}

module.exports = YarnPackageManager;
