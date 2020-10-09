'use strict';

const RegisterCommand = require('../../commands/register-command');
const RegisterHandler = require('../../utils/register-handler');
const AuthHandler = require('../../utils/auth-handler');
const Command = require('../../commands/command');
const sandbox = require('sinon').createSandbox();

describe('Command: Register', () => {

    let authHandler,
        command,
        askCredentialsStub,
        registerStub,
        parseResponseStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new RegisterCommand(authHandler);
        askCredentialsStub = sandbox.stub(command.handler, 'askCredentials');
        registerStub = sandbox.stub(command.handler, 'register');
        parseResponseStub = sandbox.stub(command.handler, 'parseResponse');
        printStub = sandbox.stub(Command.prototype, 'print');
        catchErrorStub = sandbox.stub(Command.prototype, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(RegisterHandler);
    });

    it('should have assigned handler if not specified in constructor', () => {

        command = new RegisterCommand();

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(RegisterHandler);
    });

    it('should call handler methods in expected order and print result', async () => {

        askCredentialsStub.resolves();
        registerStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(askCredentialsStub, registerStub, parseResponseStub, printStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should call handler methods in expected order if register method rejects', async () => {

        const fakeError = 'fakeError';
        askCredentialsStub.resolves();
        registerStub.rejects(fakeError);

        try {

            await command.execute();
        }
        catch (err) {

            sandbox.assert.callOrder(askCredentialsStub, registerStub, catchErrorStub);
            sandbox.assert.calledOnceWithExactly(catchErrorStub, fakeError);
            sandbox.assert.notCalled(parseResponseStub);
            sandbox.assert.notCalled(printStub);
        }
    });
});
