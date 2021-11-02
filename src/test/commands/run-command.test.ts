import Context from '../../context';
import Command from '../../commands/command';
import CommandResult from '../../utils/command-result';
import RunCommand from '../../commands/run-command';
import BackendReceiver from '../../receivers/backend-receiver';
import WordpressReceiver from '../../receivers/wordpress-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: run', () => {

    const sandbox = createSandbox();

    let command: RunCommand,
        context: Context,
        helpSpy: SinonSpy,
        printResultStub: SinonStub,
        runStub: SinonStub;

    beforeEach(() => {

        sandbox.stub(CommandResult.prototype, 'addTextLine');
        helpSpy = sandbox.spy(RunCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver run method and print result if entity is backend', async () => {

        runStub = sandbox.stub(BackendReceiver.prototype, 'run');
        context = new Context('backend', 'run', [], []);
        command = new RunCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(runStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call wordpress receiver run method and print result if entity is wordpress', async () => {

        runStub = sandbox.stub(WordpressReceiver.prototype, 'run');
        context = new Context('wordpress', 'run', [], []);
        command = new RunCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(runStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('backend', 'run', [], ['--help']);
        command = new RunCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if entity is undefined', async () => {

        context = new Context('', 'run', [], []);
        command = new RunCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
