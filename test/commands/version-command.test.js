'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const VersionCommand = require('../../commands/version-command');
const AppReceiver = require('../../receivers/app-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: version', () => {

    let command, context, helpSpy, getVersionStub, printResultStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(VersionCommand.prototype, 'help');
        getVersionStub = sandbox.stub(AppReceiver.prototype, 'getVersion');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver getVersion method and print result', () => {

        context = new Context('app', 'version', '', []);
        command = new VersionCommand(context);

        command.execute();

        sandbox.assert.calledOnce(getVersionStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('app', 'version', '', ['-h']);
        command = new VersionCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});