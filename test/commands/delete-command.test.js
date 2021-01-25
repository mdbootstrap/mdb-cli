'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const DeleteCommand = require('../../commands/delete-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const DatabaseReceiver = require('../../receivers/database-receiver');
const FrontendReceiver = require('../../receivers/frontend-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: delete', () => {

    let command, context, deleteStub, printResultStub;

    beforeEach(() => {

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
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.backendReceiver.result]);
    });

    it('should call database receiver delete method and print result if entity is database', async () => {

        deleteStub = sandbox.stub(DatabaseReceiver.prototype, 'delete');
        context = new Context('database', 'delete', '', []);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(deleteStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.databaseReceiver.result]);
    });

    it('should call frontend receiver delete method and print result if entity is frontend', async () => {

        deleteStub = sandbox.stub(FrontendReceiver.prototype, 'delete');
        context = new Context('frontend', 'delete', '', []);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(deleteStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.frontendReceiver.result]);
    });
});
