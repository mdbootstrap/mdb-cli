'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const HelpCommand = require('../../commands/help-command');
const AppReceiver = require('../../receivers/app-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: help', () => {

    let command, context;

    beforeEach(() => {

        context = new Context('app', 'help', '', []);
        command = new HelpCommand(context);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver getHelp method and print result', () => {

        const getHelpStub = sandbox.stub(AppReceiver.prototype, 'getHelp');
        const printResultStub = sandbox.stub(Command.prototype, 'printResult');

        command.execute();

        sandbox.assert.calledOnce(getHelpStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });
});