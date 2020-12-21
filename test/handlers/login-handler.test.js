'use strict';

const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const LoginStrategy = require('../../models/login-strategy');
const NormalLoginStrategy = require('../../utils/strategies/login/normal-login-strategy');
const GoogleLoginStrategy = require('../../utils/strategies/login/google-login-strategy');
const FacebookLoginStrategy = require('../../utils/strategies/login/facebook-login-strategy');
const TwitterLoginStrategy = require('../../utils/strategies/login/twitter-login-strategy');
const sandbox = require('sinon').createSandbox();

describe('Handler: Login', () => {

    let authHandler;
    let handler;

    beforeEach(() => {

        const handlerClass = require('../../utils/login-handler');
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

    it('should have `_userToken` property', (done) => {

        expect(handler).to.have.property('_userToken');

        done();
    });

    it('should have assigned authHandler', (done) => {

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

    it('should not set socialProvider', function () {

        const fakeArgs = [''];

        handler.setArgs(fakeArgs);

        expect(handler.socialProvider).to.eq(LoginStrategy.Normal);
    });

    it('should set socialProvider to Google', function () {

        const fakeArgs = ['--method=google'];

        handler.setArgs(fakeArgs);

        expect(handler.socialProvider).to.eq(LoginStrategy.Google);
    });

    it('should set Google login strategy', function () {

        handler.socialProvider = 'google';

        handler.setStrategy();

        expect(handler.strategy).to.be.an.instanceOf(GoogleLoginStrategy)
    });

    it('should set Facebook login strategy', function () {

        handler.socialProvider = 'facebook';

        handler.setStrategy();

        expect(handler.strategy).to.be.an.instanceOf(FacebookLoginStrategy)
    });

    it('should set Twitter login strategy', function () {

        handler.socialProvider = 'twitter';

        handler.setStrategy();

        expect(handler.strategy).to.be.an.instanceOf(TwitterLoginStrategy)
    });

    it('should set Normal login strategy', function () {

        handler.socialProvider = 'normal';

        handler.setStrategy();

        expect(handler.strategy).to.be.an.instanceOf(NormalLoginStrategy)
    });

    it('should login()', async () => {

        const fakeStrategy = {
            login: sandbox.stub()
        };

        handler.strategy = fakeStrategy;

        await handler.login();

        expect(fakeStrategy.login).to.have.been.calledOnce;
    });

    it('should parseResponse() when object passed', (done) => {

        const fakeToken = 'fake-token';
        const fakeResponse = [{ token: fakeToken }];

        handler.parseResponse(fakeResponse);

        expect(handler._userToken).to.be.equal(fakeToken);

        done();
    });

    it('should parseResponse() when string passed', (done) => {

        const fakeToken = 'fake-token';
        const fakeResponse = JSON.stringify([{ token: fakeToken }]);

        handler.parseResponse(fakeResponse);

        expect(handler._userToken).to.be.equal(fakeToken);

        done();
    });

    it('should not saveToken() if _userToken is empty', (done) => {

        const expectedResult = [{ 'Status': CliStatus.ERROR, 'Message': 'Login failed' }];

        handler._userToken = '';

        handler.saveToken();

        const actualResult = handler.result;

        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'saveToken() did not set expected result');

        done();
    });

    it('should write user token and set handler.result on saveToken()', (done) => {

        const fs = require('fs');

        const mkdirStub = sandbox.stub(fs, 'mkdir').callsArgWith(2);
        const writeFileStub = sandbox.stub(fs, 'writeFile').returns(undefined);

        const expectedResult = [{ 'Status': CliStatus.SUCCESS, 'Message': 'Login successful' }];

        handler._userToken = 'fake-token';

        handler.saveToken();

        const actualResult = handler.result;

        expect(mkdirStub.called).to.be.true;
        expect(writeFileStub.called).to.be.true;
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'saveToken() did not set expected result');

        done();
    });

    it('should set handler.result on saveToken() if writeFile fails', (done) => {

        const fs = require('fs');

        const fakeError = new Error('Fake error');
        sandbox.stub(fs, 'mkdir').callsArgWith(2);
        const writeFileStub = sandbox.stub(fs, 'writeFile').throws(fakeError);

        const expectedResult = [{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Login failed: ${fakeError.message}` }];

        handler._userToken = 'fake-token';

        handler.saveToken();

        const actualResult = handler.result;

        expect(writeFileStub.called).to.be.true;
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'saveToken() did not set expected result');

        done();
    });
});
