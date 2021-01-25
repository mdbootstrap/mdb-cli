'use strict';

const { deserializeJsonFile } = require('../../helpers/deserialize-json-file');
const sandbox = require('sinon').createSandbox();
const fs = require('fs');

describe('Helper: deserializeJsonFile', () => {

    const fakeJsonFile = 'fakeJsonFile';
    let readFileStub;

    beforeEach(() => {

        readFileStub = sandbox.stub(fs, 'readFile');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should return promise', () => {

        expect(deserializeJsonFile(fakeJsonFile)).to.be.a('promise');
    });

    it('should parse json file', async () => {

        const jsonParseStub = sandbox.spy(JSON, 'parse');

        readFileStub.yields(null, '{"test": "value"}');

        const result = await deserializeJsonFile(fakeJsonFile);
        expect(jsonParseStub).to.have.been.calledOnce;
        expect(result).to.be.an('object');
        expect(result).to.deep.eq({test: 'value'});
    });

    it('should call fs.readFile', (done) => {

        deserializeJsonFile(fakeJsonFile);

        expect(readFileStub).to.have.been.calledOnce;
        done();
    });

    it('should call fs.readFile with expected args', (done) => {

        deserializeJsonFile(fakeJsonFile);

        expect(readFileStub).to.have.been.calledWith(fakeJsonFile, 'utf8');
        done();
    });

    it('should throw error from fs.readFile', async () => {

        readFileStub.throws('fakeErr');

        try {

            await deserializeJsonFile();
        } catch (e) {

            return expect(e.name).to.be.eq('fakeErr');
        }

        chai.assert.fail('fs.readFile function should throw error');
    });
});
