'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const LogsCommand = require('../../commands/logs-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const WordpressReceiver = require('../../receivers/wordpress-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: logs', () => {

    let command, context, helpSpy, logsStub, printResultStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(LogsCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
        
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver logs method and print result if entity is backend', async () => {

        logsStub = sandbox.stub(BackendReceiver.prototype, 'logs');
        context = new Context('backend', 'logs', '', []);
        command = new LogsCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(logsStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call wordpress receiver logs method and print result if entity is wordpress', async () => {

        logsStub = sandbox.stub(WordpressReceiver.prototype, 'logs');
        context = new Context('wordpress', 'logs', '', []);
        command = new LogsCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(logsStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('wordpress', 'logs', '', ['--help']);
        command = new LogsCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });

    it('should call help method and print result if entity is undefined', async () => {

        context = new Context('', 'logs', '', []);
        command = new LogsCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
