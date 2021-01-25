'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const LogsCommand = require('../../commands/logs-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: logs', () => {

    let command, context;

    beforeEach(() => {

        context = new Context('backend', 'logs', '', []);
        sandbox.stub(context, 'authenticateUser');
        command = new LogsCommand(context);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver logs method and print result', async () => {

        const logsStub = sandbox.stub(BackendReceiver.prototype, 'logs');
        const printResultStub = sandbox.stub(Command.prototype, 'printResult');

        await command.execute();

        sandbox.assert.calledOnce(logsStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.backendReceiver.result]);
    });
});
