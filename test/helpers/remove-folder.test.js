'use strict';

const { removeFolder } = require('../../helpers/remove-folder');
const fse = require('fs-extra');
const sandbox = require('sinon').createSandbox();

describe('Helper: remove folder', () => {

    let removeStub;

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call fse.remove', (done) => {

        removeStub = sandbox.stub(fse, 'remove');

        removeFolder();

        expect(removeStub.calledOnce).to.be.true;

        done();
    });

    it('should return promise', () => {

        removeStub = sandbox.stub(fse, 'remove');

        expect(removeFolder()).to.be.a('promise');
    });

    it('should call fse.remove with path argument', (done) => {

        removeStub = sandbox.stub(fse, 'remove');

        const fakePath = 'fakePath';

        removeFolder(fakePath);

        expect(removeStub.calledWith(fakePath)).to.be.true;

        done();
    });

    it('should resolve if fse.remove works', async () => {

        removeStub = sandbox.stub(fse, 'remove').yields(undefined);

        try {

            const result = await removeFolder();
            expect(result).to.be.equal(undefined);
        } catch (e) {

            expect(e).to.be.equal(undefined);
        }
    });

    it('should reject if fse.remove throws error', async () => {

        const fakeError = 'fake error';
        removeStub = sandbox.stub(fse, 'remove').yields(fakeError);

        try {

            await removeFolder();
        } catch (e) {

            expect(e).to.be.equal(fakeError);
        }
    });
});
