'use strict';

const AuthHandler = require('../../utils/auth-handler');
const handlerClass = require('../../utils/logout-handler');
const sandbox = require('sinon').createSandbox();

describe('Handler: Logout', () => {

    let authHandler;
    let handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);

        handler = new handlerClass(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have `result` property', (done) => {

        expect(handler).to.have.property('result');

        done();
    });

    it('should have assigned authHandler', (done) => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        handler = new handlerClass();

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

        const fs = require('fs');
        const fsUnlinkSyncStub = sandbox.stub(fs, 'unlinkSync').returns(undefined);

        await handler.logout();

        expect(fsUnlinkSyncStub.called).to.be.true;

        return Promise.resolve();
    });

    it('should reject on fs.unlinkSync failure', async () => {

        const fs = require('fs');
        const fakeError = new Error('Fake error');
        sandbox.stub(fs, 'unlinkSync').throws(fakeError);

        try {

            await handler.logout();
        } catch (err) {

            expect(err[0].Message).to.be.equal('Logout failed: Fake error');
        }

        return Promise.resolve();
    });
});
