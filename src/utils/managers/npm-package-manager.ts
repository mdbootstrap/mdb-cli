'use strict';

import PackageManager from "./package-manager";

class NpmPackageManager extends PackageManager {

    get cmdCommand() {
        return 'npm';
    }

    init(cwd?: string) {
        return this._task(['init'], 'package.json created. Proceeding...', 'package.json initialization failed', cwd);
    }

    build(cwd: string) {
        return this._task(['run', 'build'], 'Project built successfully', 'Project could not be built', cwd);
    }

    test() {
        return this._task(['run', 'test'], 'Tests ran successfully', 'Tests failed');
    }

    update() {
        return this._task(['i', '-g', 'mdb-cli'], 'Successfully updated', 'Update failed');
    }
}

export default NpmPackageManager;
