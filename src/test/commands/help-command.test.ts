import Context from '../../context';
import Command from '../../commands/command';
import AppReceiver from '../../receivers/app-receiver';
import HelpCommand from '../../commands/help-command';
import { createSandbox } from 'sinon';

describe('Command: help', () => {

    const sandbox = createSandbox();

    let command: HelpCommand,
        context: Context;

    beforeEach(() => {

        context = new Context('app', 'help', [], []);
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
        sandbox.assert.calledOnce(printResultStub);
    });
});