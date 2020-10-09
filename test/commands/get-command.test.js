'use strict';

const GetCommand = require('../../commands/get-command');
const AuthHandler = require('../../utils/auth-handler');
const GetHandler = require('../../utils/get-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: Get', () => {

    let authHandler,
        command,
        setArgsStub,
        fetchProjectsStub,
        askForProjectNameStub,
        getUserProjectStub,
        getResultStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new GetCommand(authHandler);
        setArgsStub = sandbox.stub(command.handler, 'setArgs');
        fetchProjectsStub = sandbox.stub(command.handler, 'fetchProjects');
        askForProjectNameStub = sandbox.stub(command.handler, 'askForProjectName');
        getUserProjectStub = sandbox.stub(command.handler, 'getUserProject');
        getResultStub = sandbox.stub(command.handler, 'getResult');
        printStub = sandbox.stub(command, 'print');
        catchErrorStub = sandbox.stub(command, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command.handler).to.be.an.instanceOf(GetHandler);
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new GetCommand();

        expect(command).to.have.property('authHandler');
    });

    it('should call handler methods in expected order', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.resolves();
        getUserProjectStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, getUserProjectStub, printStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should catch error if fetchProjects() rejects', async () => {

        fetchProjectsStub.rejects('fakeError');

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, catchErrorStub);
        sandbox.assert.notCalled(askForProjectNameStub);
        sandbox.assert.notCalled(getUserProjectStub);
        sandbox.assert.notCalled(getResultStub);
        sandbox.assert.notCalled(printStub);
    });

    it('should catch error if askForProjectName() rejects', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.rejects('fakeError');

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, catchErrorStub);
        sandbox.assert.notCalled(getUserProjectStub);
        sandbox.assert.notCalled(getResultStub);
        sandbox.assert.notCalled(printStub);
    });

    it('should catch error if getUserProject() rejects', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.resolves();
        getUserProjectStub.rejects('fakeError');

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, getUserProjectStub, catchErrorStub);
        sandbox.assert.notCalled(getResultStub);
        sandbox.assert.notCalled(printStub);
    });
});