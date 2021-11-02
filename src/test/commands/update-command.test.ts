import Context from '../../context';
import Command from '../../commands/command';
import AppReceiver from '../../receivers/app-receiver';
import UpdateCommand from '../../commands/update-command';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: update', () => {

    const sandbox = createSandbox();

    let command: UpdateCommand,
        context: Context,
        helpSpy: SinonSpy,
        printResultStub: SinonStub,
        updateStub: SinonStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(UpdateCommand.prototype, 'help');
        updateStub = sandbox.stub(AppReceiver.prototype, 'updateApp');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver getupdate method and print result', async () => {

        context = new Context('app', 'update', [], []);
        command = new UpdateCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(updateStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('app', 'update', [], ['-h']);
        command = new UpdateCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});