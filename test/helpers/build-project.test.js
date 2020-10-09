'use strict';

const sandbox = require('sinon').createSandbox();
const { expect, assert } = require('chai');
const CliStatus = require('../../models/cli-status');
const NpmPackageManager = require('../../utils/managers/npm-package-manager');

describe('Helper: buildProject', () => {

    const childProcess = require('child_process');
    const directoryPath = '/fake/directory/path';
    const { buildProject } = require('../../helpers/build-project');
    let spawnStub, manager;

    beforeEach(() => {

        manager = new NpmPackageManager();
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call spawn method', (done) => {

        const fakeReturnedStream = { on: (event, cb) => cb() };
        spawnStub = sandbox.stub(childProcess, 'spawn').returns(fakeReturnedStream);

        buildProject(manager, directoryPath).catch(err => {
            if (err) console.log(err);
        });

        assert(spawnStub.called);

        done();
    });

    it('should spawn npm run build on linux with expected args', (done) => {

        const fakeReturnedStream = { on: (event, cb) => cb() };
        sandbox.stub(manager, 'isWindows').value(false);
        spawnStub = sandbox.stub(childProcess, 'spawn').returns(fakeReturnedStream);

        buildProject(manager, directoryPath).catch((err) => {
            if (err) console.log(err);
        });

        sandbox.assert.calledWith(spawnStub, 'npm', ['run', 'build'], { cwd: directoryPath, stdio: 'inherit' });

        done();
    });

    it('should spawn npm run build on windows with extected args', (done) => {

        const fakeReturnedStream = { on: (event, cb) => cb() };
        sandbox.stub(manager, 'isWindows').value(true);

        spawnStub = sandbox.stub(childProcess, 'spawn').returns(fakeReturnedStream);

        buildProject(manager, directoryPath).catch(err => {
            if (err) console.log(err);
        });

        sandbox.assert.calledWith(spawnStub, 'npm', ['run', 'build'], { cwd: directoryPath, shell: true, stdio: 'inherit' });

        done();
    });

    it('should reject if error occured', (done) => {

        const fakeReturnedStream = {
            on(event = 'error', cb) {
                if (event === 'error') cb(new Error());
            }
        };
        spawnStub = sandbox.stub(childProcess, 'spawn').returns(fakeReturnedStream);

        buildProject(manager, directoryPath).catch(err => {

            assert.isDefined(err);

            done();
        });
    });

    it('should reject if status code is 1', (done) => {

        const fakeReturnedStream = {
            on(event = 'exit', cb) {
                if (event === 'exit') cb(CliStatus.ERROR);
            }
        };
        spawnStub = sandbox.stub(childProcess, 'spawn').returns(fakeReturnedStream);

        buildProject(manager, directoryPath).catch((err) => {

            expect(err).to.include({ 'Status': CliStatus.ERROR, 'Message': 'Problem with project building' })

            done();
        });
    });

    it('should resolve if status code is 0', async () => {

        const fakeReturnedStream = {
            on(event = 'exit', cb) {
                if (event === 'exit') cb(CliStatus.SUCCESS);
            }
        };
        spawnStub = sandbox.stub(childProcess, 'spawn').returns(fakeReturnedStream);

        const result = await buildProject(manager, directoryPath);

        expect(result).to.include({ 'Status': CliStatus.SUCCESS, 'Message': 'Success' })
    });

    it('should assign directoryPath to process.cwd() if not specified', (done) => {

        const processCwdSpy = sandbox.spy(process, 'cwd');
        const fakeReturnedStream = { on: (event, cb) => cb() };
        spawnStub = sandbox.stub(childProcess, 'spawn').returns(fakeReturnedStream);

        buildProject(manager).catch(() => {

            expect(processCwdSpy.calledOnce).to.equal(true);

            done();
        });
    });
});
