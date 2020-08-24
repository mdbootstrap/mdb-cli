'use strict';

const InitCommand = require('../../commands/init-command');
const AuthHandler = require('../../utils/auth-handler');
const InitHandler = require('../../utils/init-handler');
const Command = require('../../commands/command');
const sandbox = require('sinon').createSandbox();

describe('Command: init', () => {

    const fakeError = 'fakeErr';

    let authHandler,
        command,
        setArgsStub,
        getAvailableOptionsStub,
        showUserPromptStub,
        initProjectStub,
        addJenkinsfileStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new InitCommand(authHandler);
        setArgsStub = sandbox.stub(command.handler, 'setArgs');
        getAvailableOptionsStub = sandbox.stub(command.handler, 'getAvailableOptions');
        showUserPromptStub = sandbox.stub(command.handler, 'showUserPrompt');
        initProjectStub = sandbox.stub(command.handler, 'initProject');
        addJenkinsfileStub = sandbox.stub(command.handler, 'addJenkinsfile');
        printStub = sandbox.stub(Command.prototype, 'print');
        catchErrorStub = sandbox.stub(Command.prototype, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new InitCommand();

        expect(command).to.have.property('authHandler');
    });

    it('should have InitHandler handler', () => {

        expect(command.handler).to.be.an.instanceOf(InitHandler);
    });

    it('should call handler methods in expected order', async () => {

        getAvailableOptionsStub.resolves();
        showUserPromptStub.resolves();
        initProjectStub.resolves();
        addJenkinsfileStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, getAvailableOptionsStub, showUserPromptStub, initProjectStub, addJenkinsfileStub, printStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should call handler methods in expected order if addJenkinsfileStub rejects', async () => {

        getAvailableOptionsStub.resolves();
        showUserPromptStub.resolves();
        initProjectStub.resolves();
        addJenkinsfileStub.rejects(fakeError);

        try {

            await command.execute();
        }
        catch (err) {

            sandbox.assert.callOrder(setArgsStub, getAvailableOptionsStub, showUserPromptStub, initProjectStub, addJenkinsfileStub, addJenkinsfileStub);
            sandbox.assert.calledOnceWithExactly(catchErrorStub, fakeError);
            sandbox.assert.notCalled(printStub);
        }
    });
});
