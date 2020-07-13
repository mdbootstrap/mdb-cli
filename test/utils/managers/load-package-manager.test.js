'use strict';

const loadPackageManager = require('../../../utils/managers/load-package-manager');
const YarnPackageManager = require('../../../utils/managers/yarn-package-manager');
const NpmPackageManager = require('../../../utils/managers/npm-package-manager');
const PackageManager = require('../../../utils/managers/package-manager');
const PackageManagers = require('../../../models/package-managers');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../../helpers');
const inquirer = require('inquirer');
const fs = require('fs');

describe('Utils: loadPackageManager', () => {

    let deserializeJsonFileStub, serializeJsonFileStub;

    beforeEach(() => {

        deserializeJsonFileStub = sandbox.stub(helpers, 'deserializeJsonFile');
        serializeJsonFileStub = sandbox.stub(helpers, 'serializeJsonFile');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should read default package manager from .mdb file if default is npm', async () => {

        deserializeJsonFileStub.resolves({ packageManager: PackageManagers.NPM });

        const result = await loadPackageManager();

        expect(result).to.be.an.instanceOf(PackageManager);
        expect(result).to.be.an.instanceOf(NpmPackageManager);
    });

    it('should read default package manager from .mdb file if default is yarn', async () => {

        deserializeJsonFileStub.resolves({ packageManager: PackageManagers.YARN });

        const result = await loadPackageManager();

        expect(result).to.be.an.instanceOf(PackageManager);
        expect(result).to.be.an.instanceOf(YarnPackageManager);
    });

    it('should ask about and save package manager if not specyfied', async () => {

        deserializeJsonFileStub.resolves({ name: 'abc' });
        const promptStub = sandbox.stub().resolves({ name: PackageManagers.YARN })
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        sandbox.stub(fs, 'existsSync').returns(true);

        const result = await loadPackageManager();

        expect(result).to.be.an.instanceOf(PackageManager);
        expect(result).to.be.an.instanceOf(YarnPackageManager);
    });
});