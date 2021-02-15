'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const CommandResult = require('../../utils/command-result');
const RestartCommand = require('../../commands/restart-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const WordpressReceiver = require('../../receivers/wordpress-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: restart', () => {

    let command, context, helpSpy, printResultStub, restartStub;

    beforeEach(() => {

        sandbox.stub(CommandResult.prototype, 'addTextLine');
        helpSpy = sandbox.spy(RestartCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver restart method and print result if entity is backend', async () => {

        restartStub = sandbox.stub(BackendReceiver.prototype, 'restart');
        context = new Context('backend', 'restart', '', []);
        command = new RestartCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(restartStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call wordpress receiver restart method and print result if entity is wordpress', async () => {

        restartStub = sandbox.stub(WordpressReceiver.prototype, 'restart');
        context = new Context('wordpress', 'restart', '', []);
        command = new RestartCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(restartStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('backend', 'restart', '', ['--help']);
        command = new RestartCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if entity is undefined', async () => {

        context = new Context('', 'restart', '', []);
        command = new RestartCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
