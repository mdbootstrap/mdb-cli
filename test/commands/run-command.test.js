'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const CommandResult = require('../../utils/command-result');
const RunCommand = require('../../commands/run-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const WordpressReceiver = require('../../receivers/wordpress-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: run', () => {

    let command, context, helpSpy, printResultStub, runStub;

    beforeEach(() => {

        sandbox.stub(CommandResult.prototype, 'addTextLine');
        helpSpy = sandbox.spy(RunCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver run method and print result if entity is backend', async () => {

        runStub = sandbox.stub(BackendReceiver.prototype, 'run');
        context = new Context('backend', 'run', '', []);
        command = new RunCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(runStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call wordpress receiver run method and print result if entity is wordpress', async () => {

        runStub = sandbox.stub(WordpressReceiver.prototype, 'run');
        context = new Context('wordpress', 'run', '', []);
        command = new RunCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(runStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('backend', 'run', '', ['--help']);
        command = new RunCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if entity is undefined', async () => {

        context = new Context('', 'run', '', []);
        command = new RunCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
