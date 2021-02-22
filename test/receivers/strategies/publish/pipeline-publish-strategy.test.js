'use strict';

const PipelinePublishStrategy = require('../../../../receivers/strategies/publish/pipeline-publish-strategy');
const Context = require('../../../../context');
const GitManager = require('../../../../utils/managers/git-manager');
const helpers = require('../../../../helpers');
const config = require('../../../../config');
const btoa = require('btoa');
const fs = require('fs');

const sandbox = require('sinon').createSandbox();

describe('Strategy: PipelinePublishStrategy', () => {

    let result, git, context, strategy;

    beforeEach(() => {

        result = {
            liveTextLine: sandbox.stub(),
            addAlert: sandbox.stub()
        };

        sandbox.stub(Context.prototype, 'authenticateUser');

        git = new GitManager();
        context = new Context('', '', [], []);
        strategy = new PipelinePublishStrategy(context, result, git);
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    it('should publish project', async function () {

        const fakeToken = `fakefake.${btoa(JSON.stringify({ name: 'fakeUsername' }))}.fakefake`;
        sandbox.stub(strategy, 'userToken').value(fakeToken);
        sandbox.stub(git, 'currentBranch').resolves('fakebranch');
        const createJenkinsfileStub = sandbox.stub(strategy, 'createJenkinsfile').resolves();
        const statusStub = sandbox.stub(git, 'status').resolves();
        const mergeStub = sandbox.stub(strategy, 'confirmMerge').resolves();
        const pushStub = sandbox.stub(git, 'push').resolves();
        const saveSettingsStub = sandbox.stub(strategy, 'confirmSaveSettings').resolves();

        await strategy.publish();

        expect(createJenkinsfileStub).to.have.been.calledOnce;
        expect(statusStub).to.have.been.calledOnce;
        expect(mergeStub).to.have.been.calledOnce;
        expect(pushStub).to.have.been.calledOnce;
        expect(saveSettingsStub).to.have.been.calledOnce;
    });

    it('should print alert if publish failed', async function () {

        const fakeToken = `fakefake.${btoa(JSON.stringify({ name: 'fakeUsername' }))}.fakefake`;
        sandbox.stub(strategy, 'userToken').value(fakeToken);
        sandbox.stub(git, 'currentBranch').resolves('fakebranch');
        sandbox.stub(strategy, 'createJenkinsfile').rejects();

        await strategy.publish();

        expect(result.addAlert).to.have.been.calledOnce;
    });

    describe('Method: createJenkinsfile()', function () {

        it('should attempt to create Jenkinsfile but should not re-create it', async function () {

            sandbox.stub(helpers, 'createJenkinsfile').resolves(false);

            const commitStub = sandbox.stub(git, 'commit').resolves();
            const pushStub = sandbox.stub(git, 'push').resolves();

            await strategy.createJenkinsfile('fakebranch');

            expect(commitStub).to.not.have.been.called;
            expect(pushStub).to.not.have.been.called;
        });

        it('should commit and push Jenkinsfile after creating', async function () {

            sandbox.stub(helpers, 'createJenkinsfile').resolves(true);

            const commitStub = sandbox.stub(git, 'commit').resolves();
            const pushStub = sandbox.stub(git, 'push').resolves();

            await strategy.createJenkinsfile('fakebranch');

            expect(commitStub).to.have.been.called;
            expect(pushStub).to.have.been.called;
        });
    });

    describe('Method: confirmMerge()', function () {

        it('should not merge if current branch is mdbgo/public', async function () {

            sandbox.stub(config, 'mdbgoPipelinePublicBranch').value('mdbgo/public');

            const confirmPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt').resolves();

            await strategy.confirmMerge('mdbgo/public');

            expect(confirmPromptStub).to.not.have.been.called;
        });

        it('should throw error if user did not allow merging to mdbgo.public', async function () {

            sandbox.stub(config, 'mdbgoPipelinePublicBranch').value('mdbgo/public');

            const confirmPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt').resolves(false);
            const checkoutStub = sandbox.stub(git, 'checkout').resolves();
            const pullStub = sandbox.stub(git, 'pull').resolves();
            const mergeStub = sandbox.stub(git, 'merge').resolves();

            try {
                await strategy.confirmMerge('fakebranch');
            } catch (e) {
                expect(confirmPromptStub).to.have.been.calledOnce;
                expect(checkoutStub).to.not.have.been.called;
                expect(pullStub).to.not.have.been.called;
                expect(mergeStub).to.not.have.been.called;
                return;
            }

            chai.assert.fail('confirmMerge() should throw an error');
        });

        it('should pull, checkout and merge if user agreed', async function () {

            sandbox.stub(config, 'mdbgoPipelinePublicBranch').value('mdbgo/public');

            const confirmPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt').resolves(true);
            const checkoutStub = sandbox.stub(git, 'checkout').resolves();
            const pullStub = sandbox.stub(git, 'pull').resolves();
            const mergeStub = sandbox.stub(git, 'merge').resolves();

            await strategy.confirmMerge('fakebranch');

            expect(confirmPromptStub).to.have.been.calledOnce;
            expect(checkoutStub).to.have.been.calledOnce;
            expect(pullStub).to.have.been.calledOnce;
            expect(mergeStub).to.have.been.calledOnce;
        });
    });

    describe('Method: confirmSaveSettings()', function () {

        it('should not override settings if preferred publish method already set', async function () {

            context.mdbConfig.mdbConfig.publishMethod = 'ftp';

            const confirmPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt').resolves();

            await strategy.confirmSaveSettings();

            expect(confirmPromptStub).to.not.have.been.called;
        });

        it('should not save preferred publish method if user did not agree', async function () {

            const confirmPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt').resolves(false);

            await strategy.confirmSaveSettings();

            expect(confirmPromptStub).to.have.been.calledOnce;
            expect(result.addAlert).to.have.been.calledOnce;
        });

        it('should save preferred publish method if user agreed', async function () {

            sandbox.stub(context.mdbConfig, 'save');

            const confirmPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt').resolves(true);
            const commitStub = sandbox.stub(git, 'commit').resolves();

            await strategy.confirmSaveSettings();

            expect(confirmPromptStub).to.have.been.calledOnce;
            expect(commitStub).to.have.been.calledOnce;
        });
    });
});
