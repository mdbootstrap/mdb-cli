'use strict';

const { saveToken } = require('../../helpers/save-token');
const fs = require('fs');
const config = require('../../config/index');

describe('Helper: save token', () => {

    const fakeToken = 'fakeToken';
    const fakeTokenDir = 'fakeTokenDir';
    const fakeTokenFile = 'fakeTokenFile';
    let mkdirStub;
    let writeFileStub;

    beforeEach(() => {

        mkdirStub = sinon.stub(fs, 'mkdir');
        writeFileStub = sinon.stub(fs, 'writeFile');
        sinon.replace(config, 'tokenDir', fakeTokenDir);
        sinon.replace(config, 'tokenFile', fakeTokenFile);
    });

    afterEach(() => {

        mkdirStub.reset();
        mkdirStub.restore();
        writeFileStub.reset();
        writeFileStub.restore();
        sinon.restore();
    });

    describe('Functions calls', () => {

        it('should call fs.mkdir if token given', () => {

            mkdirStub.yields();
            writeFileStub.yields();

            saveToken(fakeToken);

            expect(mkdirStub.calledOnce).to.be.true;
        });

        it('should not call fs.mkdir if token given', () => {

            saveToken();

            expect(mkdirStub.calledOnce).to.be.false;
        });

        it('should call fs.writeFile', () => {

            mkdirStub.yields(false);
            writeFileStub.yields();

            saveToken(fakeToken);

            expect(mkdirStub.calledOnce).to.be.true;
        });

        it('should call fs.writeFile if error code equal EEXIST', () => {

            mkdirStub.yields({ code: 'EEXIST' });
            writeFileStub.yields();

            saveToken(fakeToken);

            expect(mkdirStub.calledOnce).to.be.true;
        });

        it('should not call fs.writeFile if error code not equal EEXIST', () => {

            const fakeError = 'fake error';
            mkdirStub.yields('fake error');

            try {

                saveToken(fakeToken);
            } catch (e) {

                expect(e).to.be.equal(fakeError);
            }
        });
    });

    describe('Functions calls with expected arguments', () => {

        it('should call fs.readFile with expected args', () => {

            saveToken(fakeToken);

            expect(mkdirStub.calledWith(fakeTokenDir, { recursive: true, mode: 493 })).to.be.true;
        });

        it('should call fs.writeFile with expected args', () => {

            mkdirStub.yields();

            saveToken(fakeToken);

            expect(writeFileStub.calledWith(fakeTokenDir + fakeTokenFile, fakeToken, {encoding: 'utf8', mode: 0o644})).to.be.true;
        });
    });

    it('should return true if no error', () => {

        expect(saveToken(fakeToken)).to.be.true;
    });

    it('should return false if token not given', () => {

        expect(saveToken()).to.be.false;
    });

    it('should throw error from writeFile', () => {

        mkdirStub.yields(false);
        writeFileStub.yields('fake error');

        try {

            saveToken(fakeToken);
        } catch (e) {

            expect(e).to.be.equal('fake error');
        }
    });
});
