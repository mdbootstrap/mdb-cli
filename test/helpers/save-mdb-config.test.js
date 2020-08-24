'use strict';

const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const { saveMdbConfig } = helpers;
const fs = require('fs');

describe('Helper: save mdb config', () => {

    const fakeErr = 'fakeErr';

    let commitStub, writeFileStub, platformStub;

    beforeEach(() => {

        writeFileStub = sandbox.stub(fs, 'writeFile');
        commitStub = sandbox.stub(helpers, 'commitFile');
        platformStub = sandbox.stub(process, 'platform');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should reject if error', async () => {

        writeFileStub.yields(fakeErr);

        try {

            await saveMdbConfig('fake/path', 'fake content', false);

        } catch (err) {

            expect(err).to.be.eq(fakeErr);
        }
    });

    it('should resolve if no errors and commit file', async () => {

        writeFileStub.yields(undefined);
        platformStub.value('linux');
        commitStub.resolves();

        await saveMdbConfig('fake/path', 'fake content', true);

        sandbox.assert.calledOnce(commitStub);
    });

    it('should resolve if no errors on windows', async () => {

        writeFileStub.yields(undefined);
        platformStub.value('win32');

        await saveMdbConfig('fake/path', 'fake content', false);

        sandbox.assert.notCalled(commitStub);
    });
});
