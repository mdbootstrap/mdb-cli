'use strict';

import PackageManager from "../../../utils/managers/package-manager";
import YarnPackageManager from "../../../utils/managers/yarn-package-manager";
import { expect } from 'chai';
import { createSandbox, SinonStub } from 'sinon';

describe('Utils: YarnPackageManager', () => {

    const sandbox = createSandbox();

    const fakeCwd = 'fake/cwd';

    let manager: YarnPackageManager,
        taskStub: SinonStub;

    beforeEach(() => {

        manager = new YarnPackageManager();
        // @ts-ignore
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

        await manager.update();

        sandbox.assert.calledWith(taskStub, ['global', 'add', 'mdb-cli'], 'Successfully updated', 'Update failed');
    });
});
