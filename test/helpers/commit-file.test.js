'use strict';

const sandbox = require('sinon').createSandbox();
const { commitFile } = require('../../helpers');
const childProcess = require('child_process');

describe('Helper: commit file', () => {

    const filename = 'fakeFileName';
    const message = 'fake message';

    let spawnStub, returnedStream, platformStub;

    beforeEach(() => {
        
        platformStub = sandbox.stub(process, 'platform');
        spawnStub = sandbox.stub(childProcess, 'spawn');
        returnedStream = { on: sandbox.stub() };
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should resolve if exit code is 0', async () => {

        returnedStream.on.withArgs('exit').yields(0);
        spawnStub.returns(returnedStream);
        platformStub.value('linux');

        const result = await commitFile(filename, message);

        sandbox.assert.calledTwice(spawnStub);
        expect(result).to.be.eq(undefined);
    });

    it('should resolve if exit code is 0 on windows', async () => {

        returnedStream.on.withArgs('exit').yields(0);
        spawnStub.returns(returnedStream);
        platformStub.value('win32');

        const result = await commitFile(filename, message);

        sandbox.assert.calledTwice(spawnStub);
        expect(result).to.be.eq(undefined);
    });

    it('should reject if exit code is diffrent from 0', async () => {

        returnedStream.on.withArgs('exit').yields(1);
        spawnStub.returns(returnedStream);
        platformStub.value('linux');

        try {

            await commitFile(filename, message);
        }
        catch (err) {

            sandbox.assert.calledOnce(spawnStub);
            expect(err).to.be.eq(1);
        }
    });

    it('should reject if exit code is diffrent from 0 on windows', async () => {

        returnedStream.on.withArgs('exit').yields(1);
        spawnStub.returns(returnedStream);
        platformStub.value('win32');

        try {

            await commitFile(filename, message);
        }
        catch (err) {

            sandbox.assert.calledOnce(spawnStub);
            expect(err).to.be.eq(1);
        }
    });

    it('should reject if exit code is diffrent from 0', async () => {

        returnedStream.on.withArgs('exit').onFirstCall().yields(0);
        returnedStream.on.withArgs('exit').onSecondCall().yields(1);
        spawnStub.returns(returnedStream);
        platformStub.value('linux');

        try {

            await commitFile(filename, message);
        }
        catch (err) {

            sandbox.assert.calledTwice(spawnStub);
            expect(err).to.be.eq(1);
        }
    });

    it('should reject if exit code is diffrent from 0 on windows', async () => {

        returnedStream.on.withArgs('exit').onFirstCall().yields(0);
        returnedStream.on.withArgs('exit').onSecondCall().yields(1);
        spawnStub.returns(returnedStream);
        platformStub.value('win32');

        try {

            await commitFile(filename, message);
        }
        catch (err) {

            sandbox.assert.calledTwice(spawnStub);
            expect(err).to.be.eq(1);
        }
    });
});
