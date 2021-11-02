import config from '../../../../config';
import Context from '../../../../context';
import helpers from '../../../../helpers';
import { PipelinePublishStrategy } from '../../../../receivers/strategies/publish';
import GitManager from '../../../../utils/managers/git-manager';
import HttpWrapper from '../../../../utils/http-wrapper';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Strategy: PipelinePublishStrategy', () => {

    const sandbox = createSandbox();

    let result: { liveTextLine: SinonStub, addAlert: SinonStub },
        git: GitManager,
        context: Context,
        strategy: PipelinePublishStrategy,
        http: HttpWrapper;

    beforeEach(() => {

        result = {
            liveTextLine: sandbox.stub(),
            addAlert: sandbox.stub()
        };

        sandbox.stub(Context.prototype, 'authenticateUser');

        git = new GitManager();
        http = new HttpWrapper();
        context = new Context('', '', [], []);
        // @ts-ignore
        strategy = new PipelinePublishStrategy(context, result, git, http, { headers: {} });
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    it('should publish project', async function () {

        sandbox.stub(git, 'currentBranch').resolves('fakebranch');
        const createJenkinsfileStub = sandbox.stub(strategy, 'createJenkinsfile').resolves();
        const statusStub = sandbox.stub(git, 'status').resolves();
        const mergeStub = sandbox.stub(strategy, 'confirmMerge').resolves();
        const pushStub = sandbox.stub(git, 'push').resolves();
        const saveSettingsStub = sandbox.stub(strategy, 'confirmSaveSettings').resolves();
        const updateStatusStub = sandbox.stub(strategy, 'updateProjectStatus').resolves();

        await strategy.publish();

        expect(createJenkinsfileStub).to.have.been.calledOnce;
        expect(statusStub).to.have.been.calledOnce;
        expect(mergeStub).to.have.been.calledOnce;
        expect(pushStub).to.have.been.calledOnce;
        expect(saveSettingsStub).to.have.been.calledOnce;
        expect(updateStatusStub).to.have.been.calledOnce;
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

    describe('Method: updateProjectStatus()', function () {

        it('should set options update project status', async function () {

            sandbox.stub(git, 'getCurrentRemoteUrl').returns('fake.remote.url');
            const getValueStub = sandbox.stub(context.mdbConfig, 'getValue');
            getValueStub.withArgs('projectName').returns('fakeProjectName')
            getValueStub.withArgs('domain').returns('fake.domain.name');
            const postStub = sandbox.stub(http, 'post').resolves();

            await strategy.updateProjectStatus();

            sandbox.assert.calledOnce(postStub);
            // @ts-ignore
            expect(strategy.options.path).to.be.eq('/project/save/fakeProjectName');
            // @ts-ignore
            expect(strategy.options.data).to.be.eq('{"repoUrl":"fake.remote.url","domain":"fake.domain.name"}');
        });
    });
});
