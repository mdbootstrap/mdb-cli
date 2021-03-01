'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const LoginCommand = require('../../commands/login-command');
const UserReceiver = require('../../receivers/user-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: login', () => {

    let command, context, helpSpy, loginStub, printResultStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(LoginCommand.prototype, 'help');
        loginStub = sandbox.stub(UserReceiver.prototype, 'login');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver login method and print result', async () => {

        context = new Context('user', 'login', '', []);
        command = new LoginCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(loginStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('user', 'login', '', ['-h']);
        command = new LoginCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});