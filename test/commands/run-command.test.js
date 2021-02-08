'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const RunCommand = require('../../commands/run-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const sandbox = require('sinon').createSandbox();


describe('Command: run', () => {

    let command, context;

    beforeEach(() => {

        context = new Context('backend', 'run', '', []);
        sandbox.stub(context, 'authenticateUser');
        command = new RunCommand(context);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver run method and print result', async () => {

        const runStub = sandbox.stub(BackendReceiver.prototype, 'run');
        const printResultStub = sandbox.stub(Command.prototype, 'printResult');

        await command.execute();

        sandbox.assert.calledOnce(runStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });
});
