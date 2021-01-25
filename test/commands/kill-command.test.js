'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const KillCommand = require('../../commands/kill-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: kill', () => {

    let command, context;

    beforeEach(() => {

        context = new Context('backend', 'kill', '', []);
        sandbox.stub(context, 'authenticateUser');
        command = new KillCommand(context);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver kill method and print result', async () => {

        const killStub = sandbox.stub(BackendReceiver.prototype, 'kill');
        const printResultStub = sandbox.stub(Command.prototype, 'printResult');

        await command.execute();

        sandbox.assert.calledOnce(killStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.backendReceiver.result]);
    });
});
