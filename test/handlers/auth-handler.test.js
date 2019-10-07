'use strict';

const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();

describe('Handler: Auth', () => {

    let authHandler;
    let fsExistsStub;
    
    beforeEach(() => {
        
        sandbox.stub(console, 'table');
        sandbox.stub(process, 'exit');
        fsExistsStub = sandbox.stub(require('fs'), 'existsSync');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should set expected result if user is not logged in', () => {

        const expectedResult = { 'Status': CliStatus.UNAUTHORIZED, 'Message': 'Please login first' };
        authHandler = new AuthHandler(true);
        sandbox.stub(authHandler, 'isAuth').value(false);
        authHandler.setAuthHeader();

        chai.assert.deepEqual(authHandler.result[0], expectedResult, 'setAuthHeader() did not set expected result');
    });

    it('should call fs.existsSync() method', () => {

        authHandler = new AuthHandler(false);
        authHandler.setAuthHeader();

        expect(fsExistsStub.called).to.be.true;
    });
});
