import helpers from '../../helpers';
import Context from '../../context';
import Command from '../../commands/command';
import InitCommand from '../../commands/init-command';
import BackendReceiver from '../../receivers/backend-receiver';
import BlankReceiver from '../../receivers/blank-receiver';
import DatabaseReceiver from '../../receivers/database-receiver';
import FrontendReceiver from '../../receivers/frontend-receiver';
import RepoReceiver from '../../receivers/repo-receiver';
import StarterReceiver from '../../receivers/starter-receiver';
import WordpressReceiver from '../../receivers/wordpress-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: init', () => {

    const sandbox = createSandbox();

    const fakeStarter = [{
        category: 'fakeCategory',
        displayName: 'fakeName',
        license: 'fakeLicense',
        code: 'fakeCode',
        type: 'fakeType',
        available: true
    }];

    let command: InitCommand,
        context: Context,
        createListPromptStub: SinonStub,
        initStub: SinonStub,
        printResultStub: SinonStub;

    beforeEach(() => {

        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        createListPromptStub = sandbox.stub(helpers, 'createListPrompt');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call starter receiver init method and print result if entity is starter', async () => {

        initStub = sandbox.stub(StarterReceiver.prototype, 'init');
        context = new Context('starter', 'init', [], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call frontend receiver init method and print result if entity is frontend', async () => {

        initStub = sandbox.stub(FrontendReceiver.prototype, 'init');
        context = new Context('frontend', 'init', [], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call backend receiver init method and print result if entity is backend', async () => {

        initStub = sandbox.stub(BackendReceiver.prototype, 'init');
        context = new Context('backend', 'init', [], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call wordpress receiver init method and print result if entity is wordpress', async () => {

        initStub = sandbox.stub(WordpressReceiver.prototype, 'init');
        context = new Context('wordpress', 'init', [], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call database receiver init method and print result if entity is database', async () => {

        initStub = sandbox.stub(DatabaseReceiver.prototype, 'init');
        context = new Context('database', 'init', [], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call blank receiver init method and print result if entity is blank', async () => {

        initStub = sandbox.stub(BlankReceiver.prototype, 'init');
        context = new Context('blank', 'init', [], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call repo receiver init method and print result if entity is repo', async () => {

        initStub = sandbox.stub(RepoReceiver.prototype, 'init');
        context = new Context('repo', 'init', [], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call startWizard method and print form if --wizard flag provided', async () => {

        const wizzardStub = sandbox.spy(InitCommand.prototype, 'startWizard');
        context = new Context('', 'init', [], ['--wizard']);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(wizzardStub);
    });

    it('should call help method if receiver is undefined', async () => {

        const helpMethodSpy = sandbox.spy(InitCommand.prototype, 'help');
        // @ts-ignore
        sandbox.stub(InitCommand.prototype, '_getStartersOptions').resolves(fakeStarter);
        createListPromptStub.resolves('fakeCode');
        context = new Context('fake', 'init', [], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpMethodSpy);
    });
});
