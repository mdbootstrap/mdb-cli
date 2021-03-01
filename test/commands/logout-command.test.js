'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const LogoutCommand = require('../../commands/logout-command');
const UserReceiver = require('../../receivers/user-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: logout', () => {

    let command, context, helpSpy, logoutStub, printResultStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(LogoutCommand.prototype, 'help');
        logoutStub = sandbox.stub(UserReceiver.prototype, 'logout');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver logout method and print result', async () => {

        context = new Context('user', 'logout', '', []);
        command = new LogoutCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(logoutStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('user', 'logout', '', ['-h']);
        command = new LogoutCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});