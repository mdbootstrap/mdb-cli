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
const saveMdbConfig = require('../../../helpers/save-mdb-config');

describe('Utils: loadPackageManager', () => {

    const fakeError = 'fakeError';

    let deserializeJsonFileStub,
        serializeJsonFileStub,
        existsSyncStub,
        inquirerStub,
        commitFileStub,
        saveMdbConfigStub,
        promptStub;

    beforeEach(() => {

        deserializeJsonFileStub = sandbox.stub(helpers, 'deserializeJsonFile');
        serializeJsonFileStub = sandbox.stub(helpers, 'serializeJsonFile');
        inquirerStub = sandbox.stub(inquirer, 'createPromptModule');
        saveMdbConfigStub = sandbox.stub(helpers, 'saveMdbConfig');
        commitFileStub = sandbox.stub(helpers, 'commitFile');
        existsSyncStub = sandbox.stub(fs, 'existsSync');
        promptStub = sandbox.stub();
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

    it('should ask about and save package manager if not specified', async () => {

        deserializeJsonFileStub.resolves({ name: 'abc' });
        promptStub.resolves({ name: PackageManagers.YARN })
        inquirerStub.returns(promptStub);
        existsSyncStub.returns(true);

        const result = await loadPackageManager();

        expect(result).to.be.an.instanceOf(PackageManager);
        expect(result).to.be.an.instanceOf(YarnPackageManager);
    });

    it('should ask about and save package manager if not specified and .mdb file does not exist', async () => {

        deserializeJsonFileStub.rejects();
        promptStub.resolves({ name: PackageManagers.YARN })
        inquirerStub.returns(promptStub);
        existsSyncStub.onFirstCall().returns(false);
        existsSyncStub.onSecondCall().returns(false);
        existsSyncStub.onThirdCall().returns(true);
        saveMdbConfigStub.resolves();

        const result = await loadPackageManager();

        sandbox.assert.calledOnce(saveMdbConfigStub);
        expect(result).to.be.an.instanceOf(PackageManager);
        expect(result).to.be.an.instanceOf(YarnPackageManager);
    });

    it('should save package manager and commit .mdb file', async () => {

        deserializeJsonFileStub.resolves({});
        serializeJsonFileStub.resolves();
        promptStub.resolves({ name: PackageManagers.YARN })
        inquirerStub.returns(promptStub);
        existsSyncStub.returns(true);
        commitFileStub.resolves();

        const result = await loadPackageManager(true, true);

        sandbox.assert.calledOnce(commitFileStub);
        expect(result).to.be.an.instanceOf(PackageManager);
        expect(result).to.be.an.instanceOf(YarnPackageManager);
    });

    it('should load manager without saving data in .mdb file', async () => {

        deserializeJsonFileStub.resolves({});
        serializeJsonFileStub.resolves();
        promptStub.resolves({ name: PackageManagers.YARN })
        inquirerStub.returns(promptStub);
        existsSyncStub.returns(true);

        const result = await loadPackageManager(false);

        sandbox.assert.notCalled(saveMdbConfigStub);
        sandbox.assert.notCalled(commitFileStub);
        expect(result).to.be.an.instanceOf(PackageManager);
        expect(result).to.be.an.instanceOf(YarnPackageManager);
    });

    it('should log error if problem with saving file', async () => {

        deserializeJsonFileStub.rejects();
        promptStub.resolves({ name: PackageManagers.YARN })
        inquirerStub.returns(promptStub);
        existsSyncStub.returns(false);
        saveMdbConfigStub.rejects(fakeError);
        const errStub = sandbox.stub(console, 'error');

        try {

            await loadPackageManager();
        }
        catch (err) {

            expect(err).to.be.eq(fakeError);
            sandbox.assert.calledOnce(errStub);
        }
    });

    it('should reject if the .mdb file is invalid', async () => {

        const expectedResult = { Status: 1, Message: '.mdb file is invalid. Please remove it and try again.' };
        deserializeJsonFileStub.rejects('Unexpected token');
        existsSyncStub.returns(true);

        try {

            await loadPackageManager();
        }
        catch (err) {

            expect(err).to.be.deep.equal(expectedResult);
        }
    });
});