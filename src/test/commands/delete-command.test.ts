'use strict';

import Context from '../../context';
import Command from '../../commands/command';
import DeleteCommand from '../../commands/delete-command';
import BackendReceiver from '../../receivers/backend-receiver';
import DatabaseReceiver from '../../receivers/database-receiver';
import FrontendReceiver from '../../receivers/frontend-receiver';
import WordpressReceiver from '../../receivers/wordpress-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: delete', () => {

    const sandbox = createSandbox();

    let command: DeleteCommand,
        context: Context,
        deleteStub: SinonStub,
        helpSpy: SinonSpy,
        printResultStub: SinonStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(DeleteCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver delete method and print result if entity is backend', async () => {

        deleteStub = sandbox.stub(BackendReceiver.prototype, 'delete');
        context = new Context('backend', 'delete', [], []);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(deleteStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call database receiver delete method and print result if entity is database', async () => {

        deleteStub = sandbox.stub(DatabaseReceiver.prototype, 'delete');
        context = new Context('database', 'delete', [], []);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(deleteStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call frontend receiver delete method and print result if entity is frontend', async () => {

        deleteStub = sandbox.stub(FrontendReceiver.prototype, 'delete');
        context = new Context('frontend', 'delete', [], []);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(deleteStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call wordpress receiver delete method and print result if entity is wordpress', async () => {

        deleteStub = sandbox.stub(WordpressReceiver.prototype, 'delete');
        context = new Context('wordpress', 'delete', [], []);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(deleteStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('frontend', 'delete', [], ['--help']);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });

    it('should call help method and print result if entity is undefined', async () => {

        context = new Context('', 'delete', [], []);
        command = new DeleteCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
