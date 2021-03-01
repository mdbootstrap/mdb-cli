'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const UpdateCommand = require('../../commands/update-command');
const AppReceiver = require('../../receivers/app-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: update', () => {

    let command, context, helpSpy, updateStub, printResultStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(UpdateCommand.prototype, 'help');
        updateStub = sandbox.stub(AppReceiver.prototype, 'updateApp');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver getupdate method and print result', async () => {

        context = new Context('app', 'update', '', []);
        command = new UpdateCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(updateStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('app', 'update', '', ['-h']);
        command = new UpdateCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});