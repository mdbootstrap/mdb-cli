'use strict';

const KillCommand = require('../../commands/kill-command');
const KillHandler = require('../../utils/kill-handler');
const AuthHandler = require('../../utils/auth-handler');
const Command = require('../../commands/command');
const sandbox = require('sinon').createSandbox();

describe('Command: Kill', () => {

    const fakeError = 'fakeError';

    let authHandler,
        command,
        setArgsStub,
        fetchProjectsStub,
        askForProjectNameStub,
        killStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new KillCommand(authHandler);
        setArgsStub = sandbox.stub(KillHandler.prototype, 'setArgs');
        fetchProjectsStub = sandbox.stub(KillHandler.prototype, 'fetchProjects');
        askForProjectNameStub = sandbox.stub(KillHandler.prototype, 'askForProjectName');
        killStub = sandbox.stub(KillHandler.prototype, 'kill');
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

        command = new KillCommand();

        expect(command).to.have.property('authHandler');
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(KillHandler);
    });

    it('should call handler methods in expected order', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.resolves();
        killStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, killStub, printStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should call catch error if fetchProjects rejects', async () => {

        fetchProjectsStub.rejects(fakeError);

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, catchErrorStub);
        sandbox.assert.notCalled(askForProjectNameStub);
        sandbox.assert.notCalled(printStub);
        sandbox.assert.notCalled(killStub);
    });

    it('should call catch error if askForProjectName rejects', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.rejects(fakeError);

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, catchErrorStub);
        sandbox.assert.notCalled(printStub);
        sandbox.assert.notCalled(killStub);
    });

    it('should call catch error if kill rejects', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.resolves();
        killStub.rejects(fakeError);

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, killStub, catchErrorStub);
        sandbox.assert.notCalled(printStub);
    });
});