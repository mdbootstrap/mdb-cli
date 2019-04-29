'use strict';

describe('Handler: Logout', () => {

    let handler = null;

    beforeEach(() => {

        handler = require('../../utils/logout-handler');
        handler = new handler();
    });

    it('should have `result` property', (done) => {

        expect(handler).to.have.property('result');

        done();
    });

    it('should have assigned authHandler', (done) => {

        const AuthHandler = require('../../utils/auth-handler');

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);

        done();
    });

    it('should getResult()', (done) => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'getResult() returns invalid result');

        done();
    });

    it('should call fs.unlinkSync on logout()', async () => {

        const sinon = require('sinon');
        const fs = require('fs');
        const fsUnlinkSyncStub = sinon.stub(fs, 'unlinkSync').returns(undefined);

        const handler = new (require('../../utils/logout-handler'));

        await handler.logout();

        expect(fsUnlinkSyncStub.called).to.be.true;

        fsUnlinkSyncStub.reset();
        fsUnlinkSyncStub.restore();

        return Promise.resolve();
    });

    it('should reject on fs.unlinkSync failure', async () => {

        const sinon = require('sinon');
        const fs = require('fs');
        const fakeError = 'Fake error';
        const fsUnlinkSyncStub = sinon.stub(fs, 'unlinkSync').throws(fakeError, fakeError);

        const handler = new (require('../../utils/logout-handler'));

        await handler.logout()
            .then(() => expect.fail('logout() should be rejected'))
            .catch((error) => expect(error.message === fakeError).to.be.true);

        fsUnlinkSyncStub.reset();
        fsUnlinkSyncStub.restore();

        return Promise.resolve();
    });
});
