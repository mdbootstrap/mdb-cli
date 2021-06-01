'use strict';

import Context from '../../context';
import Command from '../../commands/command';
import RenameCommand from '../../commands/rename-command';
import BackendReceiver from '../../receivers/backend-receiver';
import FrontendReceiver from '../../receivers/frontend-receiver';
import WordpressReceiver from '../../receivers/wordpress-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: rename', () => {

    const sandbox = createSandbox();

    let command: RenameCommand,
        context: Context,
        helpSpy: SinonSpy,
        printResultStub: SinonStub,
        renameStub: SinonStub;

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    beforeEach(() => {

        helpSpy = sandbox.spy(RenameCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    it('should call backend receiver rename() method and print result', async () => {

        renameStub = sandbox.stub(BackendReceiver.prototype, 'rename');
        context = new Context('backend', 'rename', [], []);
        command = new RenameCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(renameStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call frontend receiver rename() method and print result', async () => {

        renameStub = sandbox.stub(FrontendReceiver.prototype, 'rename');
        context = new Context('frontend', 'rename', [], []);
        command = new RenameCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(renameStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call wordpress receiver rename() method and print result', async () => {

        renameStub = sandbox.stub(WordpressReceiver.prototype, 'rename');
        context = new Context('wordpress', 'rename', [], []);
        command = new RenameCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(renameStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call frontend receiver rename() if entity is undefined', async () => {

        renameStub = sandbox.stub(FrontendReceiver.prototype, 'rename');
        context = new Context('', 'rename', [], []);
        command = new RenameCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(renameStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('', 'rename', [], ['-h']);
        command = new RenameCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});