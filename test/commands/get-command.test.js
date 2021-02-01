'use strict';

const helpers = require('../../helpers');
const Context = require('../../context');
const Command = require('../../commands/command');
const GetCommand = require('../../commands/get-command');
const GitManager = require('../../utils/managers/git-manager');
const BackendReceiver = require('../../receivers/backend-receiver');
const FrontendReceiver = require('../../receivers/frontend-receiver');
const WordpressReceiver = require('../../receivers/wordpress-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: get', () => {

    let command, context, getStub, printResultStub, gitStub;

    beforeEach(() => {

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
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.backendReceiver.result]);
    });

    it('should call frontend receiver get method and print result if entity is frontend', async () => {

        getStub = sandbox.stub(FrontendReceiver.prototype, 'get');
        context = new Context('frontend', 'get', '', []);
        command = new GetCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(getStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.frontendReceiver.result]);
    });

    describe('should call git clone with expected argument', () => {

        it('FrontendReceiver', async () => {

            testGitClone(FrontendReceiver, 'getFrontendProjects');
        });

        it('BackendReceiver', async () => {

            testGitClone(BackendReceiver, 'getBackendProjects');
        });

        it('WordpressReceiver', async () => {

            testGitClone(WordpressReceiver, 'getWordpressProjects');
        });

        async function testGitClone(receiver, getProjectsMethod) {

            const fakeProject = {
                projectName: 'fakeProjectName',
                repoUrl: 'https://git.mdbgo.com/fakeuser/fakeproject.git',
                userNicename: 'fakeUser'
            };

            await sandbox.stub(helpers, 'createListPrompt').returns('fakeProjectName');
            await sandbox.stub(receiver.prototype, getProjectsMethod).returns([fakeProject]);

            gitStub = await sandbox.stub(GitManager.prototype, 'clone');
            context = new Context('frontend', 'get', '', []);
            command = new GetCommand(context);

            await command.execute();

            sandbox.assert.calledOnce(gitStub);
            sandbox.assert.calledOnceWithExactly(gitStub, 'https://fakeUser@git.mdbgo.com/fakeuser/fakeproject.git');
        }
    });
});
