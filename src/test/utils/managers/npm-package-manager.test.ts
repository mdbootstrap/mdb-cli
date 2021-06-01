'use strict';

import PackageManager from "../../../utils/managers/package-manager";
import NpmPackageManager from "../../../utils/managers/npm-package-manager";
import { expect } from 'chai';
import { createSandbox, SinonStub } from 'sinon';

describe('Utils: NpmPackageManager', () => {

    const sandbox = createSandbox();

    const fakeCwd = 'fake/cwd';

    let manager: NpmPackageManager,
        taskStub: SinonStub;

    beforeEach(() => {

        manager = new NpmPackageManager();
        // @ts-ignore
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

        await manager.update();

        sandbox.assert.calledWith(taskStub, ['i', '-g', 'mdb-cli'], 'Successfully updated', 'Update failed');
    });
});
