'use strict';

const YarnPackageManager = require('../../../utils/managers/yarn-package-manager');
const PackageManager = require('../../../utils/managers/package-manager');
const PackageManagers = require('../../../models/package-managers');
const sandbox = require('sinon').createSandbox();
const childProcess = require('child_process');

describe('Utils: YarnPackageManager', () => {

    const fakeCwd = 'fake/cwd';

    let manager, spawnStub;

    beforeEach(() => {

        manager = new YarnPackageManager();
        spawnStub = sandbox.stub(childProcess, 'spawn');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should be an instance of PackageManager', () => {

        expect(manager).to.be.an.instanceOf(PackageManager);
    });

    it('should spawn `yarn info` with expected arguments', async () => {

        sandbox.stub(manager, 'isWindows').value(false);

        await manager.info();

        sandbox.assert.calledWith(spawnStub, PackageManagers.YARN, ['info', 'mdb-cli', 'version'], { stdio: 'inherit' });
    });

    it('should spawn `yarn info` with expected arguments on windows', async () => {

        sandbox.stub(manager, 'isWindows').value(true);

        await manager.info();

        sandbox.assert.calledWith(spawnStub, PackageManagers.YARN, ['info', 'mdb-cli', 'version'], { shell: true, stdio: 'inherit' });
    });

    it('should spawn `yarn init` with expected arguments', async () => {

        sandbox.stub(manager, 'isWindows').value(false);

        await manager.init(fakeCwd);

        sandbox.assert.calledWith(spawnStub, PackageManagers.YARN, ['init'], { cwd: fakeCwd, stdio: 'inherit' });
    });

    it('should spawn `yarn init` with expected arguments on windows', async () => {

        sandbox.stub(manager, 'isWindows').value(true);

        await manager.init(fakeCwd);

        sandbox.assert.calledWith(spawnStub, PackageManagers.YARN, ['init'], { cwd: fakeCwd, shell: true, stdio: 'inherit' });
    });

    it('should spawn `yarn build` with expected arguments', async () => {

        sandbox.stub(manager, 'isWindows').value(false);

        await manager.build(fakeCwd);

        sandbox.assert.calledWith(spawnStub, PackageManagers.YARN, ['build'], { cwd: fakeCwd, stdio: 'inherit' });
    });

    it('should spawn `yarn build` with expected arguments on windows', async () => {

        sandbox.stub(manager, 'isWindows').value(true);

        await manager.build(fakeCwd);

        sandbox.assert.calledWith(spawnStub, PackageManagers.YARN, ['build'], { cwd: fakeCwd, shell: true, stdio: 'inherit' });
    });

    it('should spawn `yarn global add` with expected arguments', async () => {

        sandbox.stub(manager, 'isWindows').value(false);

        await manager.update();

        sandbox.assert.calledWith(spawnStub, PackageManagers.YARN, ['global', 'add', 'mdb-cli'], { stdio: 'inherit' });
    });

    it('should spawn `yarn global add` with expected arguments on windows', async () => {

        sandbox.stub(manager, 'isWindows').value(true);

        await manager.update();

        sandbox.assert.calledWith(spawnStub, PackageManagers.YARN, ['global', 'add', 'mdb-cli'], { shell: true, stdio: 'inherit' });
    });
});