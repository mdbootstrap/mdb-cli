'use strict';

class PackageManager {

    constructor() {

        this.isWindows = process.platform === 'win32';
    }

    info() { throw new ReferenceError('Method must be implemented in a child-class'); }

    init() { throw new ReferenceError('Method must be implemented in a child-class'); }

    build() { throw new ReferenceError('Method must be implemented in a child-class'); }

    update() { throw new ReferenceError('Method must be implemented in a child-class'); }
}

module.exports = PackageManager;