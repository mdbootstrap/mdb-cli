'use strict';

import Context from '../../context';
import Command from '../../commands/command';
import CommandResult from '../../utils/command-result';
import RestartCommand from '../../commands/restart-command';
import BackendReceiver from '../../receivers/backend-receiver';
import WordpressReceiver from '../../receivers/wordpress-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: restart', () => {

    const sandbox = createSandbox();

    let command: RestartCommand,
        context: Context,
        helpSpy: SinonSpy,
        printResultStub: SinonStub,
        restartStub: SinonStub;

    beforeEach(() => {

        sandbox.stub(CommandResult.prototype, 'addTextLine');
        helpSpy = sandbox.spy(RestartCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver restart method and print result if entity is backend', async () => {

        restartStub = sandbox.stub(BackendReceiver.prototype, 'restart');
        context = new Context('backend', 'restart', [], []);
        command = new RestartCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(restartStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call wordpress receiver restart method and print result if entity is wordpress', async () => {

        restartStub = sandbox.stub(WordpressReceiver.prototype, 'restart');
        context = new Context('wordpress', 'restart', [], []);
        command = new RestartCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(restartStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('backend', 'restart', [], ['--help']);
        command = new RestartCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if entity is undefined', async () => {

        context = new Context('', 'restart', [], []);
        command = new RestartCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
