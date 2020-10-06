'use strict';

const CreateCommand = require('../../commands/create-command.js');
const AuthHandler = require('../../utils/auth-handler');
const Command = require('../../commands/command');
const sandbox = require('sinon').createSandbox();

describe('Command: Create', () => {

    const fakeError = 'fakeErr';

    let authHandler,
        command,
        getProjectNameStub,
        addJenkinsfileStub,
        createStub,
        pushToGitlabStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new CreateCommand(authHandler);
        getProjectNameStub = sandbox.stub(command.handler, 'getProjectName');
        addJenkinsfileStub = sandbox.stub(command.handler, 'addJenkinsfile');
        createStub = sandbox.stub(command.handler, 'create');
        pushToGitlabStub = sandbox.stub(command.handler, 'pushToGitlab');
        printStub = sandbox.stub(Command.prototype, 'print');
        catchErrorStub = sandbox.stub(Command.prototype, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new CreateCommand();

        expect(command).to.have.property('authHandler');
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
    });

    it('should call handler methods in expected order', async () => {

        getProjectNameStub.resolves();
        addJenkinsfileStub.resolves();
        createStub.resolves();
        pushToGitlabStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(getProjectNameStub, addJenkinsfileStub, createStub, pushToGitlabStub, printStub);
    });

    it('should call catchError if create method rejects', async () => {

        getProjectNameStub.resolves();
        addJenkinsfileStub.resolves();
        createStub.rejects(fakeError);

        try {

            await command.execute();
        }
        catch (err) {

            sandbox.assert.callOrder(getProjectNameStub, addJenkinsfileStub, createStub, catchErrorStub);
            sandbox.assert.calledOnceWithExactly(catchErrorStub, fakeError);
            sandbox.assert.notCalled(pushToGitlabStub);
            sandbox.assert.notCalled(printStub);
        }
    });

    it('should call catchError if addJenkinsfile method rejects', async () => {

        getProjectNameStub.resolves();
        addJenkinsfileStub.rejects(fakeError);

        try {

            await command.execute();
        }
        catch (err) {

            sandbox.assert.callOrder(getProjectNameStub, addJenkinsfileStub, catchErrorStub);
            sandbox.assert.calledOnceWithExactly(catchErrorStub, fakeError);
            sandbox.assert.notCalled(createStub);
            sandbox.assert.notCalled(printStub);
        }
    });

    it('should call catchError if getProjectName method rejects', async () => {

        getProjectNameStub.rejects(fakeError);

        try {

            await command.execute();
        }
        catch (err) {

            sandbox.assert.callOrder(getProjectNameStub, catchErrorStub);
            sandbox.assert.calledOnceWithExactly(catchErrorStub, fakeError);
            sandbox.assert.notCalled(addJenkinsfileStub);
            sandbox.assert.notCalled(createStub);
            sandbox.assert.notCalled(printStub);
        }
    });
});