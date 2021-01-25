'use strict';

const YarnPackageManager = require('../../../utils/managers/yarn-package-manager');
const PackageManager = require('../../../utils/managers/package-manager');
const sandbox = require('sinon').createSandbox();

describe('Utils: YarnPackageManager', () => {

    const fakeCwd = 'fake/cwd';

    let manager, taskStub;

    beforeEach(() => {

        manager = new YarnPackageManager();
        taskStub = sandbox.stub(PackageManager.prototype, '_task');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should cmdCommand getter return correct command', () => {

        expect(manager.cmdCommand).to.be.eq('yarn');
    });

    it('should spawn `yarn init` with expected arguments', async () => {

        await manager.init(fakeCwd);

        sandbox.assert.calledWith(taskStub, ['init'], 'package.json created. Proceeding...', 'package.json initialization failed', fakeCwd);
    });

    it('should spawn `yarn build` with expected arguments', async () => {

        await manager.build(fakeCwd);

        sandbox.assert.calledWith(taskStub, ['build'], 'Project built successfully', 'Project could not be built', fakeCwd);
    });

    it('should spawn `yarn test` with expected arguments', async () => {

        await manager.test();

        sandbox.assert.calledWith(taskStub, ['test'], 'Tests ran successfully', 'Tests failed');
    });

    it('should spawn `yarn global add` with expected arguments', async () => {

        await manager.update(fakeCwd);

        sandbox.assert.calledWith(taskStub, ['global', 'add', 'mdb-cli'], 'Successfully updated', 'Update failed');
    });
});
