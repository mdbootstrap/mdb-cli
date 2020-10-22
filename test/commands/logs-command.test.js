'use strict';

const LogsCommand = require('../../commands/logs-command');
const LogsHandler = require('../../utils/logs-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: Logs', () => {

    let authHandler,
        command,
        setArgsStub,
        fetchProjectsStub,
        askForProjectNameStub,
        getLogsStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new LogsCommand(authHandler);
        setArgsStub = sandbox.stub(command.handler, 'setArgs');
        fetchProjectsStub = sandbox.stub(command.handler, 'fetchProjects');
        askForProjectNameStub = sandbox.stub(command.handler, 'askForProjectName');
        getLogsStub = sandbox.stub(command.handler, 'getLogs');
        printStub = sandbox.stub(command.handler, 'print');
        catchErrorStub = sandbox.stub(command, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new LogsCommand();

        expect(command).to.have.property('authHandler');
        expect(command.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(LogsHandler);
    });

    it('should call handler methods in expected order', async () => {

        fetchProjectsStub.resolves()
        askForProjectNameStub.resolves();
        getLogsStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, getLogsStub, printStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should call handler methods in expected order if getLogs() rejects', async () => {

        fetchProjectsStub.resolves()
        askForProjectNameStub.resolves();
        getLogsStub.rejects();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, getLogsStub, catchErrorStub);
        sandbox.assert.notCalled(printStub);
    });

    it('should call handler methods in expected order if askForProjectName() rejects', async () => {

        fetchProjectsStub.resolves()
        askForProjectNameStub.rejects();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, catchErrorStub);
        sandbox.assert.notCalled(getLogsStub);
        sandbox.assert.notCalled(printStub);
    });

    it('should call handler methods in expected order if fetchProjects() rejects', async () => {

        fetchProjectsStub.rejects();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, catchErrorStub);
        sandbox.assert.notCalled(askForProjectNameStub);
        sandbox.assert.notCalled(getLogsStub);
        sandbox.assert.notCalled(printStub);
    });
});