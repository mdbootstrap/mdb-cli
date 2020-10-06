'use strict';

const InfoCommand = require('../../commands/info-command.js');
const InfoHandler = require('../../utils/info-handler');
const AuthHandler = require('../../utils/auth-handler');
const Command = require('../../commands/command');
const sandbox = require('sinon').createSandbox();

describe('Command: Info', () => {

    const fakeError = 'fakeError';

    let authHandler,
        command,
        setArgsStub,
        fetchProjectsStub,
        askForProjectNameStub,
        getInfoStub,
        printResultStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new InfoCommand(authHandler);
        setArgsStub = sandbox.stub(InfoHandler.prototype, 'setArgs');
        fetchProjectsStub = sandbox.stub(InfoHandler.prototype, 'fetchProjects');
        askForProjectNameStub = sandbox.stub(InfoHandler.prototype, 'askForProjectName');
        getInfoStub = sandbox.stub(InfoHandler.prototype, 'getInfo');
        printResultStub = sandbox.stub(InfoHandler.prototype, 'printResult');
        catchErrorStub = sandbox.stub(Command.prototype, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new InfoCommand();

        expect(command).to.have.property('authHandler');
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(InfoHandler);
    });

    it('should call handler methods in expected order', async () => {

        fetchProjectsStub.resolves()
        askForProjectNameStub.resolves();
        getInfoStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, getInfoStub, printResultStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should call catch error if fetchProjects rejects', async () => {

        fetchProjectsStub.rejects(fakeError);

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, catchErrorStub);
        sandbox.assert.notCalled(askForProjectNameStub);
        sandbox.assert.notCalled(printResultStub);
        sandbox.assert.notCalled(getInfoStub);
    });

    it('should call catch error if askForProjectName rejects', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.rejects(fakeError);

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, catchErrorStub);
        sandbox.assert.notCalled(printResultStub);
        sandbox.assert.notCalled(getInfoStub);
    });

    it('should call catch error if getInfo rejects', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.resolves();
        getInfoStub.rejects(fakeError);

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchProjectsStub, askForProjectNameStub, getInfoStub, catchErrorStub);
        sandbox.assert.notCalled(printResultStub);
    });
});