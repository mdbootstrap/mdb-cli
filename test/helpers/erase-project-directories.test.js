'use strict';

const { eraseProjectDirectories } = require('../../helpers/erase-project-directories');
const helpers = require('../../helpers/');
const fs = require('fs');

describe('Helper: erase project directories', () => {

    let existsSyncStub;
    let showConfirmationPromptStub;
    let removeFolderStub;
    let projectSlug;
    let projectName;

    beforeEach(() => {

        existsSyncStub = sinon.stub(fs, 'existsSync');
        showConfirmationPromptStub = sinon.stub(helpers, 'showConfirmationPrompt');
        removeFolderStub = sinon.stub(helpers, 'removeFolder');
    });

    afterEach(() => {

        existsSyncStub.reset();
        existsSyncStub.restore();
        showConfirmationPromptStub.reset();
        showConfirmationPromptStub.restore();
        removeFolderStub.reset();
        removeFolderStub.restore();
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

            expect(e).to.be.undefined;
        }
    });

    describe('Function calls', () => {

        it('should call existsSync', async () => {

            existsSyncStub.returns(false);

            await eraseProjectDirectories();

            expect(existsSyncStub.calledOnce).to.be.true;
        });

        it('should call existsSync twice if different names', async () => {

            projectSlug = 'fake';
            projectName = 'fakeSec';
            existsSyncStub.returns(false);

            await eraseProjectDirectories(projectSlug, projectName);

            expect(existsSyncStub.calledTwice).to.be.true;
        });

        it('should call showConfirmationPrompt', async () => {

            existsSyncStub.resolves(true);
            showConfirmationPromptStub.resolves(true);
            removeFolderStub.yields();

            await eraseProjectDirectories();

            expect(showConfirmationPromptStub.calledAfter(existsSyncStub)).to.be.true;
        });

        it('should call removeFolder twice', async () => {

            existsSyncStub.resolves(true);
            showConfirmationPromptStub.resolves(true);
            removeFolderStub.yields();

            await eraseProjectDirectories();

            expect(removeFolderStub.calledTwice).to.be.true;
        });
    });

    describe('Set if folders exist', () => {

        it('should set one folder', async () => {

            projectSlug = 'fake';
            projectName = projectSlug;
            await eraseProjectDirectories(projectSlug, projectName);

            expect(existsSyncStub.calledOnceWithExactly(projectSlug)).to.be.true;
        });

        it('should set two folders', async () => {

            projectSlug = 'fake';
            projectName = 'fakeSec';
            await eraseProjectDirectories(projectSlug, projectName);

            expect(existsSyncStub.calledTwice).to.be.true;
            expect(existsSyncStub.firstCall.args).to.be.deep.equal([ projectName ]);
            expect(existsSyncStub.secondCall.args).to.be.deep.equal([ projectSlug ]);
        });
    });

    describe('Set message', () => {

        let expectedResults;

        beforeEach(() => {

            projectSlug = 'fake';
            projectName = 'fakeSec';
            showConfirmationPromptStub.resolves(true);
            removeFolderStub.yields();
        });

        afterEach(async () => {

            await eraseProjectDirectories(projectSlug, projectName);
            expect(showConfirmationPromptStub.calledOnceWithExactly(expectedResults)).to.be.true;
        });

        it('should set message for projectSlug and projectName if same names', () => {

            projectName = projectSlug;
            existsSyncStub.returns(true);
            expectedResults = `It will erase data in ${projectName}. Continue?`;
        });

        it('should set message for projectSlug and projectName if different names', () => {

            existsSyncStub.returns(true);
            expectedResults = `It will erase data in ${projectName} and in ${projectSlug}. Continue?`;
        });

        it('should set message for projectSlug', () => {

            existsSyncStub.withArgs(projectSlug).returns(true);
            existsSyncStub.withArgs(projectName).returns(false);
            expectedResults = `It will erase data in ${projectSlug}. Continue?`;
        });

        it('should set message for projectName', () => {

            existsSyncStub.withArgs(projectSlug).returns(false);
            existsSyncStub.withArgs(projectName).returns(true);
            expectedResults = `It will erase data in ${projectName}. Continue?`;
        });
    });

    describe('Remove folders', () => {

        beforeEach(() => {

            existsSyncStub.resolves(true);
            showConfirmationPromptStub.resolves(true);
            removeFolderStub.yields();
        });

        it('should call removeFolder with projectName', async () => {

            projectName = 'fake';

            await eraseProjectDirectories(projectSlug, projectName);

            expect(removeFolderStub.firstCall.args[0]).to.be.equal(projectName);
        });

        it('should call removeFolder with projectSlug', async () => {

            projectSlug = 'fake';

            await eraseProjectDirectories(projectSlug, projectName);

            expect(removeFolderStub.secondCall.args[0]).to.be.equal(projectSlug);
        });
    });
});
