'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const VersionCommand = require('../../commands/version-command');
const AppReceiver = require('../../receivers/app-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: version', () => {

    let command, context;

    beforeEach(() => {

        context = new Context('app', 'version', '', []);
        command = new VersionCommand(context);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver getVersion method and print result', () => {

        const getVersionStub = sandbox.stub(AppReceiver.prototype, 'getVersion');
        const printResultStub = sandbox.stub(Command.prototype, 'printResult');

        command.execute();

        sandbox.assert.calledOnce(getVersionStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });
});