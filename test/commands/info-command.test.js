'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const InfoCommand = require('../../commands/info-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const DatabaseReceiver = require('../../receivers/database-receiver');
const WordpressReceiver = require('../../receivers/wordpress-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: info', () => {

    let command, context, helpSpy, infoStub, printResultStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(InfoCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver info method and print result if entity is backend', async () => {

        infoStub = sandbox.stub(BackendReceiver.prototype, 'info');
        context = new Context('backend', 'info', '', []);
        command = new InfoCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(infoStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call database receiver info method and print result if entity is database', async () => {

        infoStub = sandbox.stub(DatabaseReceiver.prototype, 'info');
        context = new Context('database', 'info', '', []);
        command = new InfoCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(infoStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call wordpress receiver info method and print result if entity is wordpress', async () => {

        infoStub = sandbox.stub(WordpressReceiver.prototype, 'info');
        context = new Context('wordpress', 'info', '', []);
        command = new InfoCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(infoStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('wordpress', 'info', '', ['--help']);
        command = new InfoCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });

    it('should call help method and print result if entity is undefined', async () => {

        context = new Context('', 'info', '', []);
        command = new InfoCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
