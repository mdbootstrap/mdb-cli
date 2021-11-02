import Context from '../../context';
import Command from '../../commands/command';
import AppReceiver from '../../receivers/app-receiver';
import VersionCommand from '../../commands/version-command';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: version', () => {

    const sandbox = createSandbox();

    let command: VersionCommand,
        context: Context,
        helpSpy: SinonSpy,
        getVersionStub: SinonStub,
        printResultStub: SinonStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(VersionCommand.prototype, 'help');
        getVersionStub = sandbox.stub(AppReceiver.prototype, 'getVersion');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver getVersion method and print result', () => {

        context = new Context('app', 'version', [], []);
        command = new VersionCommand(context);

        command.execute();

        sandbox.assert.calledOnce(getVersionStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('app', 'version', [], ['-h']);
        command = new VersionCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});