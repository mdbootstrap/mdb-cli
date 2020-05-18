'use strict';

const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();
const fs = require('fs');

describe('Handler: Auth', () => {

    let authHandler;
    let exitStub;
    let fsExistsStub;

    beforeEach(() => {

        sandbox.stub(console, 'table');
        exitStub = sandbox.stub(process, 'exit');
        fsExistsStub = sandbox.stub(fs, 'existsSync').returns(false);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should set expected result if user is not logged in', () => {

        const expectedResult = { 'Status': CliStatus.UNAUTHORIZED, 'Message': 'Please login first' };

        authHandler = new AuthHandler(true);

        chai.assert.deepEqual(authHandler.result[0], expectedResult, 'setAuthHeader() did not set expected result');
        expect(authHandler.isAuth).to.be.equal(false);
        expect(fsExistsStub.called).to.be.true;
        expect(exitStub.called).to.be.true;
    });

    it('should set expected result if user is logged in', () => {

        fsExistsStub.returns(true);
        sandbox.stub(fs, 'readFileSync').returns('fake.token');
        const expectedResult = { Authorization: 'Bearer fake.token' };

        authHandler = new AuthHandler(true);

        chai.assert.deepEqual(authHandler.headers, expectedResult, 'setAuthHeader() did not set expected result');
        expect(authHandler.isAuth).to.be.equal(true);
        expect(fsExistsStub.called).to.be.true;
        expect(exitStub.called).to.be.false;
    });
});
