'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const RegisterCommand = require('../../commands/register-command');
const UserReceiver = require('../../receivers/user-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: register', () => {

    let command, context, helpSpy, registerStub, printResultStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(RegisterCommand.prototype, 'help');
        registerStub = sandbox.stub(UserReceiver.prototype, 'register');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver register method and print result', async () => {

        context = new Context('user', 'register', '', []);
        command = new RegisterCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(registerStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('user', 'register', '', ['-h']);
        command = new RegisterCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});