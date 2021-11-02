import Context from '../../context';
import Command from '../../commands/command';
import InfoCommand from '../../commands/info-command';
import BackendReceiver from '../../receivers/backend-receiver';
import DatabaseReceiver from '../../receivers/database-receiver';
import WordpressReceiver from '../../receivers/wordpress-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: info', () => {

    const sandbox = createSandbox();

    let command: InfoCommand,
        context: Context,
        helpSpy: SinonSpy,
        infoStub: SinonStub,
        printResultStub: SinonStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(InfoCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver info method and print result if entity is backend', async () => {

        infoStub = sandbox.stub(BackendReceiver.prototype, 'info');
        context = new Context('backend', 'info', [], []);
        command = new InfoCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(infoStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call database receiver info method and print result if entity is database', async () => {

        infoStub = sandbox.stub(DatabaseReceiver.prototype, 'info');
        context = new Context('database', 'info', [], []);
        command = new InfoCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(infoStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call wordpress receiver info method and print result if entity is wordpress', async () => {

        infoStub = sandbox.stub(WordpressReceiver.prototype, 'info');
        context = new Context('wordpress', 'info', [], []);
        command = new InfoCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(infoStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('wordpress', 'info', [], ['--help']);
        command = new InfoCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });

    it('should call help method and print result if entity is undefined', async () => {

        context = new Context('', 'info', [], []);
        command = new InfoCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
