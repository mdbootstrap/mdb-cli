'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const InfoCommand = require('../../commands/info-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const DatabaseReceiver = require('../../receivers/database-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: info', () => {

    let command, context, infoStub, printResultStub;

    beforeEach(() => {

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
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.backendReceiver.result]);
    });

    it('should call database receiver info method and print result if entity is database', async () => {

        infoStub = sandbox.stub(DatabaseReceiver.prototype, 'info');
        context = new Context('database', 'info', '', []);
        command = new InfoCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(infoStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.databaseReceiver.result]);
    });
});
