'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const InitCommand = require('../../commands/init-command');
const StarterReceiver = require('../../receivers/starter-receiver');
const FrontendReceiver = require('../../receivers/frontend-receiver');
const BackendReceiver = require('../../receivers/backend-receiver');
const WordpressReceiver = require('../../receivers/wordpress-receiver');
const DatabaseReceiver = require('../../receivers/database-receiver');
const BlankReceiver = require('../../receivers/blank-receiver');
const RepoReceiver = require('../../receivers/repo-receiver');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');

describe('Command: init', () => {

    const fakeStarter = [{
        category: 'fakeCategory',
        displayName: 'fakeName',
        license: 'fakeLicense',
        code: 'fakeCode',
        type: 'fakeType',
        available: true
    }];

    let command, context, initStub, printResultStub, createListPromptStub;

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
        context = new Context('starter', 'init', '', []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call frontend receiver init method and print result if entity is frontend', async () => {

        initStub = sandbox.stub(FrontendReceiver.prototype, 'init');
        context = new Context('frontend', 'init', '', []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call backend receiver init method and print result if entity is backend', async () => {

        initStub = sandbox.stub(BackendReceiver.prototype, 'init');
        context = new Context('backend', 'init', '', []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call wordpress receiver init method and print result if entity is wordpress', async () => {

        initStub = sandbox.stub(WordpressReceiver.prototype, 'init');
        context = new Context('wordpress', 'init', '', []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call database receiver init method and print result if entity is database', async () => {

        initStub = sandbox.stub(DatabaseReceiver.prototype, 'init');
        context = new Context('database', 'init', '', []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call blank receiver init method and print result if entity is blank', async () => {

        initStub = sandbox.stub(BlankReceiver.prototype, 'init');
        context = new Context('blank', 'init', '', []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call repo receiver init method and print result if entity is repo', async () => {

        initStub = sandbox.stub(RepoReceiver.prototype, 'init');
        context = new Context('repo', 'init', '', []);
        command = new InitCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(initStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call startWizard method and print form if --wizard flag provided', async () => {

        const wizzardStub = sandbox.spy(InitCommand.prototype, 'startWizard');
        context = new Context('', 'init', '', ['--wizard']);
        command = new InitCommand(context);

        command.receiver = { init: initStub };

        await command.execute();

        sandbox.assert.calledOnce(wizzardStub);
    });

    it('should call help method if receiver is undefined', async () => {

        const helpMethodSpy = sandbox.spy(InitCommand.prototype, 'help');
        sandbox.stub(InitCommand.prototype, '_getStartersOptions').resolves(fakeStarter);
        createListPromptStub.resolves('fakeCode');
        context = new Context('fake', 'init', '', []);
        command = new InitCommand(context);

        await command.execute();

        expect(command.receiver).to.be.undefined;
        sandbox.assert.calledOnce(helpMethodSpy);
    });
});
