'use strict';

const helpers = require('../../helpers');
const Context = require('../../context');
const Command = require('../../commands/command');
const GetCommand = require('../../commands/get-command');
const GitManager = require('../../utils/managers/git-manager');
const BackendReceiver = require('../../receivers/backend-receiver');
const FrontendReceiver = require('../../receivers/frontend-receiver');
const WordpressReceiver = require('../../receivers/wordpress-receiver');
const Receiver = require('../../receivers/receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: get', () => {

    let command, context, getStub, helpSpy, printResultStub, gitStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(GetCommand.prototype, 'help');
        gitStub = sandbox.stub(GitManager.prototype, 'clone');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver get method and print result if entity is backend', async () => {

        getStub = sandbox.stub(BackendReceiver.prototype, 'get');
        context = new Context('backend', 'get', '', []);
        command = new GetCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(getStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call frontend receiver get method and print result if entity is frontend', async () => {

        getStub = sandbox.stub(FrontendReceiver.prototype, 'get');
        context = new Context('frontend', 'get', '', []);
        command = new GetCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(getStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call wordpress receiver get method and print result if entity is wordpress', async () => {

        getStub = sandbox.stub(WordpressReceiver.prototype, 'get');
        context = new Context('wordpress', 'get', '', []);
        command = new GetCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(getStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('frontend', 'delete', '', ['--help']);
        command = new GetCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });

    it('should call help method and print result if couldnt auto detect entity', async () => {

        sandbox.stub(Receiver, 'detectEntity').resolves('');

        context = new Context('', 'delete', '', []);
        command = new GetCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });

    describe('should call git clone with expected argument', () => {

        it('FrontendReceiver', async () => {

            testGitClone(FrontendReceiver, 'getFrontendProjects', 'frontend');
        });

        it('BackendReceiver', async () => {

            testGitClone(BackendReceiver, 'getBackendProjects', 'backend');
        });

        it('WordpressReceiver', async () => {

            testGitClone(WordpressReceiver, 'getWordpressProjects', 'wordpress');
        });

        async function testGitClone(receiver, getProjectsMethod, entity) {

            const fakeProject = {
                projectName: 'fakeProjectName',
                repoUrl: 'https://git.mdbgo.com/fakeuser/fakeproject.git',
                user: { userNicename: 'fakeUser' }
            };

            sandbox.stub(helpers, 'createListPrompt').resolves('fakeProjectName');
            sandbox.stub(receiver.prototype, getProjectsMethod).resolves([fakeProject]);

            context = new Context(entity, 'get', '', []);
            command = new GetCommand(context);

            await command.execute();

            sandbox.assert.calledOnce(gitStub);
            sandbox.assert.calledOnceWithExactly(gitStub, 'https://fakeUser@git.mdbgo.com/fakeuser/fakeproject.git');
        }
    });
});
