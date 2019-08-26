'use strict';

const { deserializeJsonFile } = require('../../helpers/deserialize-object-from-file');
const fs = require('fs');

describe('Helper: deserialize object from file', () => {

    let readFileStub;

    beforeEach(() => {

        readFileStub = sinon.stub(fs, 'readFile');
    });

    afterEach(() => {

        readFileStub.reset();
        readFileStub.restore();
    });

    it('should call fs.readFile', async () => {

        readFileStub.yields(undefined, JSON.stringify({}));

        await deserializeJsonFile();

        expect(readFileStub.calledOnce).to.be.true;
    });

    it('should call fs.readFile with fakePath', async () => {

        const fakePath = 'fakePath';
        readFileStub.yields(undefined, JSON.stringify({}));

        await deserializeJsonFile(fakePath);

        expect(readFileStub.calledWith(fakePath)).to.be.true;
    });

    it('should resolve expected results', async () => {

        const expectedResult = { expect: 'expect' };
        readFileStub.yields(undefined, JSON.stringify(expectedResult));

        const result = await deserializeJsonFile();

        expect(result).to.be.deep.equal(expectedResult);
    });

    it('should reject if file not found', async () => {

        const fakeError = 'fake error';
        readFileStub.yields(fakeError);

        try {

            await deserializeJsonFile();
        } catch (e) {

            expect(e).to.be.equal(fakeError);
        }
    });
});
