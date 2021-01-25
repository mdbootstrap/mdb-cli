'use strict';

const { serializeJsonFile } = require('../../helpers/serialize-json-file');
const sandbox = require('sinon').createSandbox();
const fs = require('fs');

describe('Helper: serializeJsonFile', () => {

    const fakeFileName = 'fakeName',
        fakeObject = { fake: 'object' };

    let writeFileStub;

    beforeEach(() => {

        writeFileStub = sandbox.stub(fs, 'writeFile');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('should serialize json file', () => {

        it('should call fs.writeFile', (done) => {

            serializeJsonFile(fakeFileName, fakeObject);

            expect(writeFileStub).to.be.calledOnce;
            done();
        });

        it('should call fs.writeFile with expected arguments', (done) => {

            serializeJsonFile(fakeFileName, fakeObject);
            const fakeSerializedObject = JSON.stringify(fakeObject, null, '  ');

            expect(writeFileStub).to.be.calledWith(fakeFileName, fakeSerializedObject, 'utf-8');
            done();
        });

        it('should throw error on fs.writeFile fail', async () => {

            writeFileStub.throws('fakeError');

            try {

                await serializeJsonFile(fakeFileName, fakeObject);
            } catch (e) {

                return expect(e.name).to.be.eq('fakeError');
            }

            chai.assert.fail('fs.writeFile function should throw error');
        });
    });
});
