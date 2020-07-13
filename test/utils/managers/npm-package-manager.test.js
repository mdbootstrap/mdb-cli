'use strict';

const NpmPackageManager = require('../../../utils/managers/npm-package-manager');
const PackageManager = require('../../../utils/managers/package-manager');
const PackageManagers = require('../../../models/package-managers');
const sandbox = require('sinon').createSandbox();
const childProcess = require('child_process');

describe('Utils: NpmPackageManager', () => {

    const fakeCwd = 'fake/cwd';

    let manager, spawnStub;

    beforeEach(() => {

        manager = new NpmPackageManager();
        spawnStub = sandbox.stub(childProcess, 'spawn');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should be an instance of PackageManager', () => {

        expect(manager).to.be.an.instanceOf(PackageManager);
    });

    it('should spawn `npm info` with expected arguments', async () => {

        sandbox.stub(manager, 'isWindows').value(false);

        await manager.info();

        sandbox.assert.calledWith(spawnStub, PackageManagers.NPM, ['info', 'mdb-cli', 'version'], { stdio: 'inherit' });
    });

    it('should spawn `npm info` with expected arguments on windows', async () => {

        sandbox.stub(manager, 'isWindows').value(true);

        await manager.info();

        sandbox.assert.calledWith(spawnStub, PackageManagers.NPM, ['info', 'mdb-cli', 'version'], { shell: true, stdio: 'inherit' });
    });

    it('should spawn `npm init` with expected arguments', async () => {

        sandbox.stub(manager, 'isWindows').value(false);

        await manager.init(fakeCwd);

        sandbox.assert.calledWith(spawnStub, PackageManagers.NPM, ['init'], { cwd: fakeCwd, stdio: 'inherit' });
    });

    it('should spawn `npm init` with expected arguments on windows', async () => {

        sandbox.stub(manager, 'isWindows').value(true);

        await manager.init(fakeCwd);

        sandbox.assert.calledWith(spawnStub, PackageManagers.NPM, ['init'], { cwd: fakeCwd, shell: true, stdio: 'inherit' });
    });

    it('should spawn `npm build` with expected arguments', async () => {

        sandbox.stub(manager, 'isWindows').value(false);

        await manager.build(fakeCwd);

        sandbox.assert.calledWith(spawnStub, PackageManagers.NPM, ['run', 'build'], { cwd: fakeCwd, stdio: 'inherit' });
    });

    it('should spawn `npm build` with expected arguments on windows', async () => {

        sandbox.stub(manager, 'isWindows').value(true);

        await manager.build(fakeCwd);

        sandbox.assert.calledWith(spawnStub, PackageManagers.NPM, ['run', 'build'], { cwd: fakeCwd, shell: true, stdio: 'inherit' });
    });

    it('should spawn `npm i` with expected arguments', async () => {

        sandbox.stub(manager, 'isWindows').value(false);

        await manager.update(fakeCwd);

        sandbox.assert.calledWith(spawnStub, PackageManagers.NPM, ['i', '-g', 'mdb-cli'], { stdio: 'inherit' });
    });

    it('should spawn `npm i` with expected arguments on windows', async () => {

        sandbox.stub(manager, 'isWindows').value(true);

        await manager.update(fakeCwd);

        sandbox.assert.calledWith(spawnStub, PackageManagers.NPM, ['i', '-g', 'mdb-cli'], { shell: true, stdio: 'inherit' });
    });
});