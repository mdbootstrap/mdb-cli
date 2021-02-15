'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const KillCommand = require('../../commands/kill-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const WordpressReceiver = require('../../receivers/wordpress-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: kill', () => {

    let command, context, helpSpy, killStub, printResultStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(KillCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
        
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver kill method and print result if entity is backend', async () => {

        killStub = sandbox.stub(BackendReceiver.prototype, 'kill');
        context = new Context('backend', 'kill', '', []);
        command = new KillCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(killStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call wordpress receiver kill method and print result if entity is wordpress', async () => {

        killStub = sandbox.stub(WordpressReceiver.prototype, 'kill');
        context = new Context('wordpress', 'kill', '', []);
        command = new KillCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(killStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('wordpress', 'kill', '', ['--help']);
        command = new KillCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });

    it('should call help method and print result if entity is undefined', async () => {

        context = new Context('', 'kill', '', []);
        command = new KillCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
