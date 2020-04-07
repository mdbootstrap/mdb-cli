'use strict';

const { eraseProjectDirectories } = require('../../helpers/erase-project-directories');
const helpers = require('../../helpers/');
const fs = require('fs');
const sandbox = require('sinon').createSandbox();

describe('Helper: erase project directories', () => {

    let existsSyncStub;
    let showConfirmationPromptStub;
    let removeFolderStub;
    let projectSlug;
    let projectName;

    beforeEach(() => {

        existsSyncStub = sandbox.stub(fs, 'existsSync');
        showConfirmationPromptStub = sandbox.stub(helpers, 'showConfirmationPrompt');
        removeFolderStub = sandbox.stub(helpers, 'removeFolder');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should return promise', () => {

        expect(eraseProjectDirectories()).to.be.a('promise');
    });

    it('should resolve if folders does not exist', async () => {

        existsSyncStub.returns(false);
        const result = await eraseProjectDirectories(projectSlug, projectName);

        expect(result).to.be.undefined;
    });

    it('should reject if user does not agree', async () => {

        existsSyncStub.returns(true);
        showConfirmationPromptStub.resolves(false);

        try {

            await eraseProjectDirectories();
            throw new Error('Error is not thrown');
        } catch (e) {

            expect(e).to.be.deep.equal({ Status: 'OK', Message: 'OK, will not delete existing project.' });
        }
    });

    describe('Function calls', () => {

        it('should call existsSync', async () => {

            existsSyncStub.returns(false);

            await eraseProjectDirectories();

            expect(existsSyncStub.calledOnce).to.be.true;
        });

        it('should call showConfirmationPrompt', async () => {

            existsSyncStub.resolves(true);
            showConfirmationPromptStub.resolves(true);
            removeFolderStub.resolves();

            await eraseProjectDirectories();

            expect(showConfirmationPromptStub.calledAfter(existsSyncStub)).to.be.true;
        });

        it('should call removeFolder twice', async () => {

            existsSyncStub.resolves(true);
            showConfirmationPromptStub.resolves(true);
            removeFolderStub.resolves();

            await eraseProjectDirectories();

            expect(removeFolderStub.called).to.be.true;
        });
    });

    describe('Set if folders exist', () => {

        it('should set folder name if project name is defined and folder exists', async () => {

            projectName = 'fake-name';
            projectSlug = 'fake-slug';
            removeFolderStub.resolves();
            showConfirmationPromptStub.resolves(true);
            existsSyncStub.withArgs(projectName).returns(true);
            await eraseProjectDirectories(projectSlug, projectName);

            expect(existsSyncStub.calledOnceWithExactly(projectName)).to.be.true;
        });

        it('should not set folder name if project name is defined and folder does not exists', async () => {

            projectName = 'fake-name';
            // projectSlug = 'fake-slug';
            removeFolderStub.resolves();
            showConfirmationPromptStub.resolves(true);
            existsSyncStub.withArgs(projectName).returns(false);
            // existsSyncStub.withArgs(projectSlug).returns(true);
            await eraseProjectDirectories(projectSlug, projectName);

            expect(existsSyncStub.calledOnceWithExactly(projectName)).to.be.true;
            expect(showConfirmationPromptStub.notCalled).to.be.true;
        });

        it('should set folder name if project name is empty string', async () => {
            projectName = '';
            projectSlug = 'fake-slug';
            removeFolderStub.resolves();
            showConfirmationPromptStub.resolves(true);
            existsSyncStub.withArgs(projectSlug).returns(true);
            await eraseProjectDirectories(projectSlug, projectName);

            expect(existsSyncStub.calledOnceWithExactly(projectSlug)).to.be.true;
        });

        it('should not set folder name if folders do not exist', async () => {
            projectName = 'fake-name';
            projectSlug = 'fake-slug';
            showConfirmationPromptStub.resolves(true);
            existsSyncStub.withArgs(projectName).returns(false);
            existsSyncStub.withArgs(projectSlug).returns(false);
            await eraseProjectDirectories(projectSlug, projectName);

            expect(showConfirmationPromptStub.notCalled).to.be.true;
        });
    });

    describe('Set message', () => {

        let expectedResults;

        beforeEach(() => {

            projectSlug = 'fake';
            projectName = 'fakeSec';
            showConfirmationPromptStub.resolves(true);
            removeFolderStub.resolves();
        });

        afterEach(async () => {

            await eraseProjectDirectories(projectSlug, projectName);
            expect(showConfirmationPromptStub.calledOnceWithExactly(expectedResults)).to.be.true;
        });

        it('should set message for projectName', () => {

            projectName = projectSlug;
            existsSyncStub.returns(true);
            expectedResults = `It will erase data in ${projectName}. Continue?`;
        });

        it('should set message for projectSlug', () => {

            projectName = '';
            existsSyncStub.withArgs(projectSlug).returns(true);
            expectedResults = `It will erase data in ${projectSlug}. Continue?`;
        });
    });

    describe('Remove folders', () => {

        beforeEach(() => {

            existsSyncStub.resolves(true);
            showConfirmationPromptStub.resolves(true);
            removeFolderStub.resolves();
        });

        it('should call removeFolder with projectName', async () => {

            projectName = 'fake';

            await eraseProjectDirectories(projectSlug, projectName);

            expect(removeFolderStub.firstCall.args[0]).to.be.equal(projectName);
        });

        it('should call removeFolder with projectSlug', async () => {

            projectName = '';
            projectSlug = 'fake';

            await eraseProjectDirectories(projectSlug, projectName);

            expect(removeFolderStub.firstCall.args[0]).to.be.equal(projectSlug);
        });
    });
});
