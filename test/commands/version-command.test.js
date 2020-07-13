'use strict';

const VersionCommand = require('../../commands/version-command');
const VersionHandler = require('../../utils/version-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: version', () => {

    let authHandler,
        command,
        loadPackageManagerStub,
        printVersionStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new VersionCommand(authHandler);
        loadPackageManagerStub = sandbox.stub(command.handler, 'loadPackageManager');
        printVersionStub = sandbox.stub(command.handler, 'printVersion');
        catchErrorStub = sandbox.stub(command, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new VersionCommand();

        expect(command).to.have.property('authHandler');
        expect(command.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(VersionHandler);
    });

    it('should call handler methods in expected order and print result', async () => {

        loadPackageManagerStub.resolves();
        printVersionStub.resolves();

        await command.execute();

        expect(loadPackageManagerStub.calledBefore(printVersionStub)).to.be.true;
        expect(catchErrorStub.notCalled).to.be.true;
    });

    it('should call catchError if any of methods rejects', async () => {

        const fakeError = 'fakeError';
        loadPackageManagerStub.resolves();
        printVersionStub.rejects(fakeError);

        try {

            await command.execute();
        }
        catch (err) {

            expect(loadPackageManagerStub.calledBefore(printVersionStub)).to.be.true;
            expect(printVersionStub.calledBefore(catchErrorStub)).to.be.true;
            sandbox.assert.calledWith(catchErrorStub, fakeError);
            expect(err).to.be.equal(fakeError);
        }
    });
});