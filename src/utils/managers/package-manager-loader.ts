'use strict';

import PackageManager from './package-manager';
import NpmPackageManager from './npm-package-manager';
import YarnPackageManager from './yarn-package-manager';
import { PackageManagers } from '../../models/package-managers';
import helpers from '../../helpers';

class PackageManagerLoader {

    static async load(manager?: PackageManagers): Promise<PackageManager> {

        const choices = [PackageManagers.NPM, PackageManagers.YARN];

        if (!manager) {
            const chosen = await helpers.createListPrompt('Which package manager do you use?', choices);
            manager = PackageManagers[chosen.toUpperCase() as keyof typeof PackageManagers];
        }

        switch (manager) {
            case PackageManagers.NPM: return new NpmPackageManager();
            case PackageManagers.YARN: return new YarnPackageManager();
        }
    }
}

export default PackageManagerLoader;
