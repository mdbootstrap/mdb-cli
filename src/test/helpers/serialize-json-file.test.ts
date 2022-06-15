import fs from "fs";
import helpers from "../../helpers";
import { createSandbox, SinonStub } from "sinon";
import { expect } from "chai";

describe('Helper: serializeJsonFile', () => {

    const sandbox = createSandbox();

    const fakeFileName = 'fakeName',
        fakeObject = { fake: 'object' };

    let writeFileStub: SinonStub;

    beforeEach(() => {

        writeFileStub = sandbox.stub(fs, 'writeFile');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('should serialize json file', () => {

        it('should call fs.writeFile', (done) => {

            helpers.serializeJsonFile(fakeFileName, fakeObject);

            expect(writeFileStub).to.be.calledOnce;
            done();
        });

        it('should call fs.writeFile with expected arguments', (done) => {

            helpers.serializeJsonFile(fakeFileName, fakeObject);
            const fakeSerializedObject = JSON.stringify(fakeObject, null, '  ');

            expect(writeFileStub).to.be.calledWith(fakeFileName, fakeSerializedObject, 'utf-8');
            done();
        });

        it('should throw error on fs.writeFile fail', async () => {

            writeFileStub.throws('fakeError');

            try {

                await helpers.serializeJsonFile(fakeFileName, fakeObject);
            } catch (e) {

                return expect(e.name).to.be.eq('fakeError');
            }

            chai.assert.fail('fs.writeFile function should throw error');
        });
    });
});
