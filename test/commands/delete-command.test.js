'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const DeleteCommand = require('../../commands/delete-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const DatabaseReceiver = require('../../receivers/database-receiver');
const FrontendReceiver = require('../../receivers/frontend-receiver');
const WordpressReceiver = require('../../receivers/wordpress-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: delete', () => {

    let command, context, deleteStub, helpSpy, printResultStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(DeleteCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver delete method and print result if entity is backend', async () => {

        deleteStub = sandbox.stub(BackendReceiver.prototype, 'delete');
        context = new Context('backend', 'delete', '', []);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(deleteStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call database receiver delete method and print result if entity is database', async () => {

        deleteStub = sandbox.stub(DatabaseReceiver.prototype, 'delete');
        context = new Context('database', 'delete', '', []);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(deleteStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call frontend receiver delete method and print result if entity is frontend', async () => {

        deleteStub = sandbox.stub(FrontendReceiver.prototype, 'delete');
        context = new Context('frontend', 'delete', '', []);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(deleteStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call wordpress receiver delete method and print result if entity is wordpress', async () => {

        deleteStub = sandbox.stub(WordpressReceiver.prototype, 'delete');
        context = new Context('wordpress', 'delete', '', []);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(deleteStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('frontend', 'delete', '', ['--help']);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });

    it('should call help method and print result if entity is undefined', async () => {

        context = new Context('', 'delete', '', []);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
