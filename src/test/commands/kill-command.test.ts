'use strict';

import Context from '../../context';
import Command from '../../commands/command';
import KillCommand from '../../commands/kill-command';
import BackendReceiver from '../../receivers/backend-receiver';
import DatabaseReceiver from '../../receivers/database-receiver';
import FrontendReceiver from '../../receivers/frontend-receiver';
import WordpressReceiver from '../../receivers/wordpress-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: kill', () => {

    const sandbox = createSandbox();

    let command: Command,
        context: Context,
        helpSpy: SinonSpy,
        killStub: SinonStub,
        printResultStub: SinonStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(KillCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');

    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver kill method and print result if entity is backend', async () => {

        killStub = sandbox.stub(BackendReceiver.prototype, 'kill');
        context = new Context('backend', 'kill', [], []);
        command = new KillCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(killStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call wordpress receiver kill method and print result if entity is wordpress', async () => {

        killStub = sandbox.stub(WordpressReceiver.prototype, 'kill');
        context = new Context('wordpress', 'kill', [], []);
        command = new KillCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(killStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('wordpress', 'kill', [], ['--help']);
        command = new KillCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });

    it('should call help method and print result if entity is undefined', async () => {

        context = new Context('', 'kill', [], []);
        command = new KillCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
