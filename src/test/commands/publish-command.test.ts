import fs from 'fs';
import Context from '../../context';
import Command from '../../commands/command';
import PublishCommand from '../../commands/publish-command';
import BackendReceiver from '../../receivers/backend-receiver';
import FrontendReceiver from '../../receivers/frontend-receiver';
import WordpressReceiver from '../../receivers/wordpress-receiver';
import DotMdbConfigManager from '../../utils/managers/dot-mdb-config-manager';
import { createSandbox, SinonStub } from 'sinon';

describe('Command: publish', () => {

    const sandbox = createSandbox();

    let printResultStub: SinonStub;

    beforeEach(() => {

        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
        sandbox.stub(Command.prototype, 'requireDotMdb');
        sandbox.stub(fs, 'existsSync').returns(true);
        sandbox.stub(fs, 'writeFileSync');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call frontend receiver publish() method and print result', async () => {

        const publishStub = sandbox.stub(FrontendReceiver.prototype, 'publish');
        const context = new Context('frontend', 'publish', [], []);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(publishStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call backend receiver publish() method and print result', async () => {

        const publishStub = sandbox.stub(BackendReceiver.prototype, 'publish');
        const context = new Context('backend', 'publish', [], []);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(publishStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call wordpress receiver publish() method and print result', async () => {

        const publishStub = sandbox.stub(WordpressReceiver.prototype, 'publish');
        const context = new Context('wordpress', 'publish', [], []);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(publishStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call frontend receiver publish() method and print result if entity is undefined', async () => {

        const publishStub = sandbox.stub(FrontendReceiver.prototype, 'publish');
        const context = new Context('', 'publish', [], []);
        sandbox.stub(context.mdbConfig, 'getValue').withArgs('meta.type').returns(undefined);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(publishStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call backend receiver publish() method and print result if entity is undefined but saved in config', async () => {

        sandbox.stub(Context.prototype, 'loadPackageManager');
        sandbox.stub(DotMdbConfigManager.prototype, 'getValue').withArgs('meta.type').returns('backend');
        const publishStub = sandbox.stub(BackendReceiver.prototype, 'publish');
        const context = new Context('', 'publish', [], []);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(publishStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        const helpSpy = sandbox.spy(PublishCommand.prototype, 'help');
        const context = new Context('', 'publish', [], ['-h']);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
