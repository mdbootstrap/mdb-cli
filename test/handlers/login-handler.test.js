'use strict';

describe('Handler: Login', () => {

    let handler = null;

    beforeEach(() => {

        handler = require('../../utils/login-handler');
        handler = new handler();
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

    it('should askCredentials()', async () => {

        const sinon = require('sinon');
        const inquirer = require('inquirer');

        const promptStub = sinon.stub().resolves({ username: '', password: '' });
        const createPromptModuleStub = sinon.stub(inquirer, 'createPromptModule').returns(promptStub);

        const handler = new (require('../../utils/login-handler'));

        await handler.askCredentials();

        expect(promptStub.called).to.be.true;

        createPromptModuleStub.reset();
        createPromptModuleStub.restore();

        return Promise.resolve();
    });

    it('should set options.data after askCredentials()', async () => {

        const sinon = require('sinon');
        const inquirer = require('inquirer');

        const expectedOptionsData = { username: '', password: '' };
        const promptStub = sinon.stub().resolves(expectedOptionsData);
        const createPromptModuleStub = sinon.stub(inquirer, 'createPromptModule').returns(promptStub);

        const handler = new (require('../../utils/login-handler'));

        await handler.askCredentials();

        const actualOptionsData = handler.options.data;

        chai.assert.deepEqual(actualOptionsData, expectedOptionsData, 'options has not been set after askCredentials()');

        createPromptModuleStub.reset();
        createPromptModuleStub.restore();

        return Promise.resolve();
    });

    it('should login()', async () => {

        const sinon = require('sinon');
        const HttpWrapper = require('../../utils/http-wrapper');

        const httpMock = sinon.mock(HttpWrapper.prototype);
        httpMock.expects('post').once().resolves([{ token: '' }]);

        const handler = new (require('../../utils/login-handler'));

        await handler.login();

        httpMock.verify();

        return Promise.resolve();
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

        const expectedResult = [{ 'Status': 'not logged in', 'Message': 'Login failed' }];

        handler._userToken = '';

        handler.saveToken();

        const actualResult = handler.result;

        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'saveToken() did not set expected result');

        done();
    });

    it('should create token dir on saveToken() if token dir does not exists', (done) => {

        const sinon = require('sinon');
        const fs = require('fs');

        const existsSyncStub = sinon.stub(fs, 'existsSync').returns(false);
        const mkdirSyncStub = sinon.stub(fs, 'mkdirSync').returns();

        const handler = new (require('../../utils/login-handler'));

        handler._userToken = 'fake-token';

        handler.saveToken();

        expect(existsSyncStub.called).to.be.true;
        expect(mkdirSyncStub.called).to.be.true;

        existsSyncStub.reset();
        mkdirSyncStub.reset();
        existsSyncStub.restore();
        mkdirSyncStub.restore();

        done();
    });

    it('should write user token and set handler.result on saveToken()', (done) => {

        const sinon = require('sinon');
        const fs = require('fs');

        const existsSyncStub = sinon.stub(fs, 'existsSync').returns(true);
        const writeFileSyncStub = sinon.stub(fs, 'writeFileSync').returns();

        const expectedResult = [{ 'Status': 'logged in', 'Message': 'Login successful' }];

        const handler = new (require('../../utils/login-handler'));

        handler._userToken = 'fake-token';

        handler.saveToken();

        const actualResult = handler.result;

        expect(existsSyncStub.called).to.be.true;
        expect(writeFileSyncStub.called).to.be.true;
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'saveToken() did not set expected result');

        existsSyncStub.reset();
        writeFileSyncStub.reset();
        existsSyncStub.restore();
        writeFileSyncStub.restore();

        done();
    });

    it('should set handler.result on saveToken() if writeFileSync fails', (done) => {

        const sinon = require('sinon');
        const fs = require('fs');

        const fakeError = new Error('Fake error');
        const existsSyncStub = sinon.stub(fs, 'existsSync').returns(true);
        const writeFileSyncStub = sinon.stub(fs, 'writeFileSync').throws(fakeError);

        const expectedResult = [{ 'Status': 'not logged in', 'Message': `Login failed: ${fakeError.message}` }];

        const handler = new (require('../../utils/login-handler'));

        handler._userToken = 'fake-token';

        handler.saveToken();

        const actualResult = handler.result;

        expect(writeFileSyncStub.called).to.be.true;
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'saveToken() did not set expected result');

        existsSyncStub.reset();
        writeFileSyncStub.reset();
        existsSyncStub.restore();
        writeFileSyncStub.restore();

        done();
    });
});
