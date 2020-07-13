'use strict';

const commandClass = require('../../commands/publish-command');
const AuthHandler = require('../../utils/auth-handler');
const { expect } = require('chai');
const sandbox = require('sinon').createSandbox();

describe('Command: publish', () => {

    let command,
        authHandler,
        loadPackageManagerStub,
        setProjectNameStub,
        setPackageNameStub,
        buildProjectStub,
        publishStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new commandClass(authHandler);

        loadPackageManagerStub = sandbox.stub(command.handler, 'loadPackageManager');
        setPackageNameStub = sandbox.stub(command.handler, 'setPackageName');
        setProjectNameStub = sandbox.stub(command.handler, 'setProjectName');
        buildProjectStub = sandbox.stub(command.handler, 'buildProject');
        publishStub = sandbox.stub(command.handler, 'publish');
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

        command = new commandClass();

        expect(command).to.have.property('authHandler');
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
    });

    it('should have PublishHandler handler', () => {

        const PublishHandler = require('../../utils/publish-handler');

        expect(command.handler).to.be.an.instanceOf(PublishHandler);
    });

    it('should call handler methods in expected order and print result', async () => {

        loadPackageManagerStub.resolves();
        setProjectNameStub.resolves();
        setPackageNameStub.resolves();
        buildProjectStub.resolves();
        publishStub.resolves();

        await command.execute();

        expect(loadPackageManagerStub.calledBefore(setProjectNameStub)).to.be.true;
        expect(setProjectNameStub.calledBefore(setPackageNameStub)).to.be.true;
        expect(setPackageNameStub.calledBefore(buildProjectStub)).to.be.true;
        expect(buildProjectStub.calledBefore(publishStub)).to.be.true;
        expect(publishStub.calledBefore(printStub)).to.be.true;
        expect(catchErrorStub.notCalled).to.be.true;
    });

    it('should call catchError if any of methods rejects', async () => {

        const fakeError = 'fakeError';
        loadPackageManagerStub.resolves();
        setProjectNameStub.resolves();
        setPackageNameStub.resolves();
        buildProjectStub.resolves();
        publishStub.rejects(fakeError);

        await command.execute();

        expect(loadPackageManagerStub.calledBefore(setProjectNameStub)).to.be.true;
        expect(setProjectNameStub.calledBefore(setPackageNameStub)).to.be.true;
        expect(setPackageNameStub.calledBefore(buildProjectStub)).to.be.true;
        expect(buildProjectStub.calledBefore(publishStub)).to.be.true;
        expect(publishStub.calledBefore(catchErrorStub)).to.be.true;
        expect(printStub.notCalled).to.be.true;
        expect(catchErrorStub.calledWith(fakeError));
        expect(catchErrorStub.calledAfter(publishStub)).to.be.true;
    });
});
