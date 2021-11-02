import Context from '../../context';
import Command from '../../commands/command';
import LogsCommand from '../../commands/logs-command';
import BackendReceiver from '../../receivers/backend-receiver';
import WordpressReceiver from '../../receivers/wordpress-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: logs', () => {

    const sandbox = createSandbox();

    let command: Command,
        context: Context,
        helpSpy: SinonSpy,
        logsStub: SinonStub,
        printResultStub: SinonStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(LogsCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');

    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver logs method and print result if entity is backend', async () => {

        logsStub = sandbox.stub(BackendReceiver.prototype, 'logs');
        context = new Context('backend', 'logs', [], []);
        command = new LogsCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(logsStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call wordpress receiver logs method and print result if entity is wordpress', async () => {

        logsStub = sandbox.stub(WordpressReceiver.prototype, 'logs');
        context = new Context('wordpress', 'logs', [], []);
        command = new LogsCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(logsStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('wordpress', 'logs', [], ['--help']);
        command = new LogsCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });

    it('should call help method and print result if entity is undefined', async () => {

        context = new Context('', 'logs', [], []);
        command = new LogsCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
