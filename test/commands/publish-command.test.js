'use strict';

const PublishCommand = require('../../commands/publish-command');
const PublishHandler = require('../../utils/publish-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: publish', () => {

    let command,
        authHandler,
        setArgsStub,
        handlePublishArgsStub,
        loadPackageManagerStub,
        runTestsStub,
        setProjectNameStub,
        publishStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new PublishCommand(authHandler);
        setArgsStub = sandbox.stub(command.handler, 'setArgs');
        handlePublishArgsStub = sandbox.stub(command.handler, 'handlePublishArgs');
        runTestsStub = sandbox.stub(command.handler, 'runTests');
        setProjectNameStub = sandbox.stub(command.handler, 'setProjectName');
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

        command = new PublishCommand();

        expect(command).to.have.property('authHandler');
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(PublishHandler);
    });

    it('should call handler methods in expected order and print result', async () => {

        setArgsStub.resolves();
        handlePublishArgsStub.resolves();
        runTestsStub.resolves();
        setProjectNameStub.resolves();
        publishStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, handlePublishArgsStub, runTestsStub, setProjectNameStub, publishStub, printStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should call catchError if any of methods rejects', async () => {

        const fakeError = 'fakeError';
        setArgsStub.resolves();
        handlePublishArgsStub.resolves();
        runTestsStub.resolves();
        setProjectNameStub.resolves();
        publishStub.rejects(fakeError);

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, handlePublishArgsStub, runTestsStub, setProjectNameStub, publishStub, catchErrorStub);
        expect(catchErrorStub.calledWith(fakeError));
        sandbox.assert.notCalled(printStub);
    });
});
