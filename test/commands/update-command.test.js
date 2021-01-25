'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const UpdateCommand = require('../../commands/update-command');
const AppReceiver = require('../../receivers/app-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: update', () => {

    let command, context;

    beforeEach(() => {

        context = new Context('app', 'update', '', []);
        command = new UpdateCommand(context);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver getupdate method and print result', async () => {

        const updateAppStub = sandbox.stub(AppReceiver.prototype, 'updateApp');
        const printResultStub = sandbox.stub(Command.prototype, 'printResult');

        await command.execute();

        sandbox.assert.calledOnce(updateAppStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });
});