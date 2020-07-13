'use strict';

const UpdateCommand = require('../../commands/update-command');
const UpdateHandler = require('../../utils/update-handler');
const AuthHandler = require('../../utils/auth-handler');
const { expect } = require('chai');
const sandbox = require('sinon').createSandbox();

describe('Command: update', () => {

    let authHandler,
        command,
        loadPackageManagerStub,
        updateStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new UpdateCommand(authHandler);
        loadPackageManagerStub = sandbox.stub(command.handler, 'loadPackageManager');
        updateStub = sandbox.stub(command.handler, 'update');
        printStub = sandbox.stub(command, 'print');
        catchErrorStub = sandbox.stub(command, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new UpdateCommand();

        expect(command).to.have.property('authHandler');
        expect(command.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(UpdateHandler);
    });

    it('should call handler methods in expected order and print result', async () => {

        loadPackageManagerStub.resolves();
        updateStub.resolves();

        await command.execute();

        expect(loadPackageManagerStub.calledBefore(updateStub)).to.be.true;
        expect(updateStub.calledBefore(printStub)).to.be.true;
        expect(catchErrorStub.notCalled).to.be.true;
    });

    it('should call catchError if any of methods rejects', async () => {

        const fakeError = 'fakeError';
        loadPackageManagerStub.resolves();
        updateStub.rejects(fakeError);

        try {

            await command.execute();
        }
        catch (err) {

            expect(loadPackageManagerStub.calledBefore(updateStub)).to.be.true;
            expect(updateStub.calledBefore(catchErrorStub)).to.be.true;
            sandbox.assert.calledWith(catchErrorStub, fakeError);
            expect(printStub.notCalled).to.be.true;
            expect(err).to.be.equal(fakeError);
        }
    });
});