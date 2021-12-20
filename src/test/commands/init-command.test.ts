import helpers from '../../helpers';
import Context from '../../context';
import Command from '../../commands/command';
import HttpWrapper from '../../utils/http-wrapper';
import InitCommand from '../../commands/init-command';
import BackendReceiver from '../../receivers/backend-receiver';
import BlankReceiver from '../../receivers/blank-receiver';
import ComposeReceiver from '../../receivers/compose-receiver';
import DatabaseReceiver from '../../receivers/database-receiver';
import FrontendReceiver from '../../receivers/frontend-receiver';
import RepoReceiver from '../../receivers/repo-receiver';
import StarterReceiver from '../../receivers/starter-receiver';
import WordpressReceiver from '../../receivers/wordpress-receiver';
import { createSandbox, SinonStub } from 'sinon';

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
        getStub: SinonStub,
        initStub: SinonStub,
        printResultStub: SinonStub;

    beforeEach(() => {

        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        createListPromptStub = sandbox.stub(helpers, 'createListPrompt');
        getStub = sandbox.stub(HttpWrapper.prototype, 'get');
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

    it('should call compose receiver init method and print result if entity is compose', async () => {

        initStub = sandbox.stub(ComposeReceiver.prototype, 'init');
        context = new Context('compose', 'init', [], []);
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

    it('should init frontend project with starter code', async () => {

        initStub = sandbox.stub(FrontendReceiver.prototype, 'init');
        getStub.resolves({ body: '[{"code":"free-standard","displayName":"Standard","license":"Free","category":"MDB5","type":"frontend","available":true}]', headers: {}, statusCode: 200 });
        context = new Context('frontend', 'init', ['free-standard'], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should init backend project with starter code', async () => {

        initStub = sandbox.stub(BackendReceiver.prototype, 'init');
        getStub.resolves({ body: '[{"code":"node-free","displayName":"Simple API","license":"Free","category":"Backend","type":"backend","available":true}]', headers: {}, statusCode: 200 });
        context = new Context('backend', 'init', ['node-free'], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should init wordpress project with starter code', async () => {

        initStub = sandbox.stub(WordpressReceiver.prototype, 'init');
        getStub.resolves({ body: '[{"code":"wp-starter","displayName":"MDB starter","license":"Free","category":"WordPress","type":"wordpress","available":true}]', headers: {}, statusCode: 200 });
        context = new Context('wordpress', 'init', ['wp-starter'], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should detect receiver and init frontend project with starter code', async () => {

        initStub = sandbox.stub(FrontendReceiver.prototype, 'init');
        getStub.resolves({ body: '[{"code":"free-standard","displayName":"Standard","license":"Free","category":"MDB5","type":"frontend","available":true}]', headers: {}, statusCode: 200 });
        context = new Context('', 'init', ['free-standard'], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should detect receiver and init backend project with starter code', async () => {

        initStub = sandbox.stub(BackendReceiver.prototype, 'init');
        getStub.resolves({ body: '[{"code":"node-free","displayName":"Simple API","license":"Free","category":"Backend","type":"backend","available":true}]', headers: {}, statusCode: 200 });
        context = new Context('', 'init', ['node-free'], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should detect receiver and init wordpress project with starter code', async () => {

        initStub = sandbox.stub(WordpressReceiver.prototype, 'init');
        getStub.resolves({ body: '[{"code":"wp-starter","displayName":"MDB starter","license":"Free","category":"WordPress","type":"wordpress","available":true}]', headers: {}, statusCode: 200 });
        context = new Context('', 'init', ['wp-starter'], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should detect receiver and init frontend project', async () => {

        createListPromptStub.resolves('free-standard');
        initStub = sandbox.stub(FrontendReceiver.prototype, 'init');
        getStub.resolves({ body: '[{"code":"free-standard","displayName":"Standard","license":"Free","category":"MDB5","type":"frontend","available":true}]', headers: {}, statusCode: 200 });
        context = new Context('', 'init', [], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should detect receiver and init blank project', async () => {

        createListPromptStub.resolves('blank-starter');
        initStub = sandbox.stub(BlankReceiver.prototype, 'init');
        getStub.resolves({ body: '[{"code":"blank-starter","displayName":"Blank","license":"Free","category":"","type":"","available":true}]', headers: {}, statusCode: 200 });
        context = new Context('', 'init', [], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should detect receiver and init backend project', async () => {

        createListPromptStub.onFirstCall().resolves('node-pro').onSecondCall().resolves('node-free');
        getStub.resolves({ body: '[{"code":"node-free","displayName":"Simple API","license":"Free","category":"Backend","type":"backend","available":true},{"code":"node-pro","displayName":"Simple API","license":"Pro","category":"Backend","type":"backend","available":false}]', headers: {}, statusCode: 200 });
        initStub = sandbox.stub(BackendReceiver.prototype, 'init');
        context = new Context('', 'init', [], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledTwice(printResultStub);
    });

    it('should abort after 10 failed attempts', async () => {

        createListPromptStub.resolves('node-pro');
        getStub.resolves({ body: '[{"code":"node-pro","displayName":"Simple API","license":"Pro","category":"Backend","type":"backend","available":false}]', headers: {}, statusCode: 200 });
        initStub = sandbox.stub(BackendReceiver.prototype, 'init');
        context = new Context('', 'init', [], []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.notCalled(initStub);
        sandbox.assert.callCount(printResultStub, 11);
    });

    it('should init frontend project with wizzard', async () => {

        createListPromptStub.onFirstCall().resolves('MDB5').onSecondCall().resolves('Standard').onThirdCall().resolves('Free');
        initStub = sandbox.stub(FrontendReceiver.prototype, 'init');
        getStub.resolves({ body: '[{"code":"free-standard","displayName":"Standard","license":"Free","category":"MDB5","type":"frontend","available":true}]', headers: {}, statusCode: 200 });
        context = new Context('frontend', 'init', [], ['-w']);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should not init frontend project with wizzard if starter not found', async () => {

        createListPromptStub.onFirstCall().resolves('MDB5').onSecondCall().resolves('Standard').onThirdCall().resolves('Free');
        getStub.resolves({ body: '[]', headers: {}, statusCode: 200 });
        initStub = sandbox.stub(FrontendReceiver.prototype, 'init');
        context = new Context('frontend', 'init', [], ['-w']);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.notCalled(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should not init frontend project with wizzard if starter not available', async () => {

        createListPromptStub.onFirstCall().resolves('MDB5').onSecondCall().resolves('Standard').onThirdCall().resolves('Free');
        initStub = sandbox.stub(FrontendReceiver.prototype, 'init');
        getStub.resolves({ body: '[{"code":"free-standard","displayName":"Standard","license":"Free","category":"MDB5","type":"frontend","available":false}]', headers: {}, statusCode: 200 });
        context = new Context('frontend', 'init', [], ['-w']);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.notCalled(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should init wordpress project with wizzard', async () => {

        createListPromptStub.onFirstCall().resolves('wordpress').onSecondCall().resolves('Free').onThirdCall().resolves('wp-starter');
        getStub.resolves({ body: '[{"code":"wp-starter","displayName":"MDB starter","license":"Free","category":"WordPress","type":"wordpress","available":true}]', headers: {}, statusCode: 200 });
        initStub = sandbox.stub(WordpressReceiver.prototype, 'init');
        context = new Context('', 'init', [], ['-w']);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should not init wordpress project with wizzard if starter not found', async () => {

        createListPromptStub.onFirstCall().resolves('wordpress').onSecondCall().resolves('Free').onThirdCall().resolves('');
        getStub.resolves({ body: '[{"code":"wp-starter","displayName":"MDB starter","license":"Free","category":"WordPress","type":"wordpress","available":true}]', headers: {}, statusCode: 200 });
        initStub = sandbox.stub(WordpressReceiver.prototype, 'init');
        context = new Context('', 'init', [], ['-w']);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.notCalled(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should not init wordpress project with wizard if there are no starters that meet given criteria', async () => {

        createListPromptStub.onFirstCall().resolves('wordpress').onSecondCall().resolves('Free').onThirdCall().resolves('wp-starter');
        getStub.resolves({ body: '[{"code":"wp-starter","displayName":"MDB starter","license":"Pro","category":"WordPress","type":"wordpress","available":true}]', headers: {}, statusCode: 200 });
        initStub = sandbox.stub(WordpressReceiver.prototype, 'init');
        context = new Context('', 'init', [], ['-w']);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.notCalled(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should init backend project with wizzard', async () => {

        createListPromptStub.onFirstCall().resolves('backend').onSecondCall().resolves('node').onThirdCall().resolves('node-free');
        getStub.resolves({ body: '[{"code":"node-free","displayName":"Simple API","license":"Free","category":"Backend","type":"backend","available":true}]', headers: {}, statusCode: 200 });
        initStub = sandbox.stub(BackendReceiver.prototype, 'init');
        context = new Context('', 'init', [], ['-w']);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should not init backend project with wizzard if starter not found', async () => {

        createListPromptStub.onFirstCall().resolves('backend').onSecondCall().resolves('node').onThirdCall().resolves('');
        getStub.resolves({ body: '[{"code":"node-free","displayName":"Simple API","license":"Free","category":"Backend","type":"backend","available":true}]', headers: {}, statusCode: 200 });
        initStub = sandbox.stub(BackendReceiver.prototype, 'init');
        context = new Context('', 'init', [], ['-w']);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.notCalled(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should not init backend project with wizard if there are no starters that meet given criteria', async () => {

        createListPromptStub.onFirstCall().resolves('backend').onSecondCall().resolves('node').onThirdCall().resolves('node-free');
        getStub.resolves({ body: '[]', headers: {}, statusCode: 200 });
        initStub = sandbox.stub(BackendReceiver.prototype, 'init');
        context = new Context('', 'init', [], ['-w']);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.notCalled(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should init blank project with wizzard', async () => {

        createListPromptStub.resolves('blank-starter');
        initStub = sandbox.stub(BlankReceiver.prototype, 'init');
        getStub.resolves({ body: '[{"code":"blank-starter","displayName":"Blank","license":"Free","category":"","type":"","available":true}]', headers: {}, statusCode: 200 });
        context = new Context('blank', 'init', [], ['-w']);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnce(printResultStub);
    });
});
