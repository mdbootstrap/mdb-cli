'use strict';

const NpmPackageManager = require('../../../utils/managers/npm-package-manager');
const PackageManager = require('../../../utils/managers/package-manager');
const sandbox = require('sinon').createSandbox();

describe('Utils: NpmPackageManager', () => {

    const fakeCwd = 'fake/cwd';

    let manager, taskStub;

    beforeEach(() => {

        manager = new NpmPackageManager();
        taskStub = sandbox.stub(PackageManager.prototype, '_task');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should cmdCommand getter return correct command', () => {

        expect(manager.cmdCommand).to.be.eq('npm');
    });

    it('should spawn `npm init` with expected arguments', async () => {

        await manager.init(fakeCwd);

        sandbox.assert.calledWith(taskStub, ['init'], 'package.json created. Proceeding...', 'package.json initialization failed', fakeCwd);
    });

    it('should spawn `npm build` with expected arguments', async () => {

        await manager.build(fakeCwd);

        sandbox.assert.calledWith(taskStub, ['run', 'build'], 'Project built successfully', 'Project could not be built', fakeCwd);
    });

    it('should spawn `npm test` with expected arguments', async () => {

        await manager.test();

        sandbox.assert.calledWith(taskStub, ['run', 'test'], 'Tests ran successfully', 'Tests failed');
    });

    it('should spawn `npm i` with expected arguments', async () => {

        await manager.update(fakeCwd);

        sandbox.assert.calledWith(taskStub, ['i', '-g', 'mdb-cli'], 'Successfully updated', 'Update failed');
    });
});
