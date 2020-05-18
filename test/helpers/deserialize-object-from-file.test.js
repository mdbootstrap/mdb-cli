'use strict';

const { deserializeJsonFile } = require('../../helpers/deserialize-object-from-file');
const sandbox = require('sinon').createSandbox();
const fs = require('fs');

describe('Helper: deserialize object from file', () => {

    let readFileStub;

    beforeEach(() => {

        readFileStub = sandbox.stub(fs, 'readFile');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
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

    it('should reject if parsing to json problem', async () => {

        readFileStub.yields(undefined, '');

        try {

            await deserializeJsonFile();
        } catch (e) {

            expect(e.message).to.be.equal('Unexpected end of JSON input');
        }
    });
});
