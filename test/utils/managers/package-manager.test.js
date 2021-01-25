'use strict';

const childProcess = require('child_process');
const PackageManagers = require('../../../models/package-managers');
const PackageManager = require('../../../utils/managers/package-manager');
const NpmPackageManager = require('../../../utils/managers/npm-package-manager');
const YarnPackageManager = require('../../../utils/managers/yarn-package-manager');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../../helpers');

describe('Utils: PackageManager', () => {

    let manager;

    beforeEach(() => {

        sandbox.stub(process, 'platform').value('linux');
        manager = new PackageManager();
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should throw Error if cmdComamnd getter is not declared', () => {

        try {
            const command = manager.cmdCommand;
        } catch (err) {
            expect(err.message).to.be.eq('You must declare cmdCommand getter!');
            return;
        }
        chai.assert.fail('cmdCommand getter should throw error');
    });

    it('should throw ReferenceError if manager init method is not implemented', () => {

        try {
            manager.init();
        } catch (err) {
            expect(err.message).to.equal('Method must be implemented in a child-class');
            return;
        }
        chai.assert.fail('PackageManager should throw error');
    });

    it('should throw ReferenceError if manager build method is not implemented', () => {

        try {
            manager.build();
        } catch (err) {
            expect(err.message).to.equal('Method must be implemented in a child-class');
            return;
        }
        chai.assert.fail('PackageManager should throw error');
    });

    it('should throw ReferenceError if manager test method is not implemented', () => {

        try {
            manager.test();
        } catch (err) {
            expect(err.message).to.equal('Method must be implemented in a child-class');
            return;
        }
        chai.assert.fail('PackageManager should throw error');
    });

    it('should throw ReferenceError if manager update method is not implemented', () => {

        try {
            manager.update();
        } catch (err) {
            expect(err.message).to.equal('Method must be implemented in a child-class');
            return;
        }
        chai.assert.fail('PackageManager should throw error');
    });

    describe('Method: _task', () => {

        const cmd = 'fake-cmd',
            args = ['fake', 'args'],
            successMsg = 'Fake success message',
            errorMsg = 'Fake error message',
            cwd = 'fake/cwd';

        let spawnStub;

        beforeEach(() => {

            spawnStub = sandbox.stub(childProcess, 'spawn');
            sandbox.stub(PackageManager.prototype, 'cmdCommand').value(cmd);
        });

        it('should call child process spawn method with expected arguments on linux and return success message', async () => {

            const on = sandbox.stub();
            on.withArgs('exit').yields(0);
            spawnStub.returns({ on });

            const result = await manager._task(args, successMsg, errorMsg, cwd);

            sandbox.assert.calledWith(spawnStub, cmd, args, { cwd, stdio: 'inherit' });
            expect(result).to.be.eq(successMsg);
        });

        it('should call child process spawn method with expected arguments on windows and return success message', async () => {

            sandbox.stub(process, 'platform').value('win32');
            manager = new PackageManager();
            const on = sandbox.stub();
            on.withArgs('exit').yields(0);
            spawnStub.returns({ on });

            const result = await manager._task(args, successMsg, errorMsg, cwd);

            sandbox.assert.calledWith(spawnStub, cmd, args, { cwd, stdio: 'inherit', shell: true });
            expect(result).to.be.eq(successMsg);
        });

        it('should call child process spawn method with expected arguments on linux and throw error', async () => {

            const on = sandbox.stub();
            on.withArgs('exit').yields(1);
            spawnStub.returns({ on });

            try {
                await manager._task(args, successMsg, errorMsg, cwd);
            } catch (err) {
                sandbox.assert.calledWith(spawnStub, cmd, args, { cwd, stdio: 'inherit' });
                expect(err).to.be.eq(errorMsg);
                return;
            }
            chai.assert.fail('PackageManager should throw error');
        });

        it('should call child process spawn method with expected arguments on windows and throw error', async () => {

            const fakeErr = 'Fake error';
            sandbox.stub(process, 'platform').value('win32');
            manager = new PackageManager();
            const on = sandbox.stub();
            on.withArgs('error').yields(fakeErr);
            spawnStub.returns({ on });

            try {
                await manager._task(args, successMsg, errorMsg, cwd);
            } catch (err) {
                sandbox.assert.calledWith(spawnStub, cmd, args, { cwd, stdio: 'inherit', shell: true });
                expect(err).to.be.eq(fakeErr);
                return;
            }
            chai.assert.fail('PackageManager should throw error');
        });
    });

    describe('Method: load', () => {

        let createListPromptStub;

        beforeEach(() => {

            createListPromptStub = sandbox.stub(helpers, 'createListPrompt');
        });

        it('should load npm package manager if defined in arguments', async () => {

            const result = await PackageManager.load(PackageManagers.NPM);

            expect(result).to.be.an.instanceOf(NpmPackageManager);
        });

        it('should load yarn package manager if defined in arguments', async () => {

            const result = await PackageManager.load(PackageManagers.YARN);

            expect(result).to.be.an.instanceOf(YarnPackageManager);
        });

        it('should load npm package manager if user selected it', async () => {

            createListPromptStub.resolves(PackageManagers.NPM);

            const result = await PackageManager.load();

            expect(result).to.be.an.instanceOf(NpmPackageManager);
        });

        it('should load yarn package manager if user selected it', async () => {

            createListPromptStub.resolves(PackageManagers.YARN);

            const result = await PackageManager.load();

            expect(result).to.be.an.instanceOf(YarnPackageManager);
        });
    });
});
