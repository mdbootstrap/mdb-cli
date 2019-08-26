'use strict';

const { removeFolder } = require('../../helpers/remove-folder');
const fse = require('fs-extra');

describe('Helper: remove folder', () => {

    let removeStub;

    afterEach(() => {

        removeStub.reset();
        removeStub.restore();
    });

    it('should call fse.remove', (done) => {

        removeStub = sinon.stub(fse, 'remove');

        removeFolder();

        expect(removeStub.calledOnce).to.be.true;

        done();
    });

    it('should return promise', () => {

        removeStub = sinon.stub(fse, 'remove');

        expect(removeFolder()).to.be.a('promise');
    });

    it('should call fse.remove with path argument', (done) => {

        removeStub = sinon.stub(fse, 'remove');

        const fakePath = 'fakePath';

        removeFolder(fakePath);

        expect(removeStub.calledWith(fakePath)).to.be.true;

        done();
    });
});
