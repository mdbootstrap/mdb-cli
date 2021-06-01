'use strict';

import PackageManagerLoader from "../../../utils/managers/package-manager-loader";
import YarnPackageManager from "../../../utils/managers/yarn-package-manager";
import NpmPackageManager from "../../../utils/managers/npm-package-manager";
import { PackageManagers } from "../../../models/package-managers";
import helpers from '../../../helpers';
import { createSandbox } from 'sinon';
import { expect } from 'chai';

describe('Utils: PackageManager', () => {

    const sandbox = createSandbox();

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: load', () => {

        it('should load npm package manager if defined in arguments', async () => {

            const result = await PackageManagerLoader.load(PackageManagers.NPM);

            expect(result).to.be.an.instanceOf(NpmPackageManager);
        });

        it('should load yarn package manager if defined in arguments', async () => {

            const result = await PackageManagerLoader.load(PackageManagers.YARN);

            expect(result).to.be.an.instanceOf(YarnPackageManager);
        });

        it('should load package manager if not defined in arguments', async () => {

            sandbox.stub(helpers, 'createListPrompt').resolves('yarn');

            const result = await PackageManagerLoader.load();

            expect(result).to.be.an.instanceOf(YarnPackageManager);
        });
    });
});
