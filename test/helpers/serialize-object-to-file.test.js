'use strict';

const { serializeJsonFile } = require('../../helpers/serialize-object-to-file');
const fs = require('fs');
const sandbox = require('sinon').createSandbox();

describe('Helper: serialize object to file', () => {

    const fakePath = 'fakePath';
    const fakeObject = { expect: 'expect' };
    let writeFileStub;

    beforeEach(() => {

        writeFileStub = sandbox.stub(fs, 'writeFile');
        writeFileStub.yields(undefined);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should return promise', async () => {

        expect(serializeJsonFile()).to.be.a('promise');
    });

    it('should call fs.writeFile', async () => {

        await serializeJsonFile(fakePath, fakeObject);

        expect(writeFileStub.calledOnce).to.be.true;
    });

    it('should call fs.readFile with expected args', async () => {

        await serializeJsonFile(fakePath, fakeObject);

        expect(writeFileStub.calledWith(fakePath, JSON.stringify(fakeObject, null, '  '))).to.be.true;
    });

    it('should reject if file not found', async () => {

        const fakeError = 'fake error';
        writeFileStub.yields(fakeError);

        try {

            await serializeJsonFile();
        } catch (e) {

            expect(e).to.be.equal(fakeError);
        }
    });
});
