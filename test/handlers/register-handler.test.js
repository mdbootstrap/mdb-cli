'use strict';

const RegisterHandler = require('../../utils/register-handler');
const AuthHandler = require('../../utils/auth-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const inquirer = require('inquirer');

describe('Handler: Register', () => {

    let authHandler, handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new RegisterHandler(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have `result` property', () => {

        expect(handler).to.have.property('result');
    });

    it('should have assigned authHandler', () => {

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should have assigned authHandler if not specified in constructor', () => {

        handler = new RegisterHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should getResult()', () => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        expect(actualResult).to.be.deep.eq(actualResult);
    });

    it('should set options.data after askCredentials()', async () => {

        const optionsData = { name: '', username: '', email: '', password: '', repeatPassword: '' };
        const expectedOptionsData = JSON.stringify(optionsData);
        const promptStub = sandbox.stub().resolves(optionsData);
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        await handler.askCredentials();

        const actualOptionsData = handler.options.data;

        expect(expectedOptionsData).to.be.deep.eq(actualOptionsData);
    });

    it('should register method make http POST request', () => {

        const postStub = sandbox.stub(HttpWrapper.prototype, 'post');

        handler.register();

        sandbox.assert.calledOnce(postStub);
    });

    it('should parse response, set result and call saveToken method', () => {

        const token = 'fake.user.token';
        const saveTokenStub = sandbox.stub(handler, 'saveToken');

        handler.parseResponse([{ loggedin: true, token }]);

        expect(handler.result).to.be.deep.eq([{ 'Status': CliStatus.SUCCESS, 'Message': 'Registration successful' }]);
        sandbox.assert.calledOnceWithExactly(saveTokenStub, token);
    });

    it('should parse response and set result if registration fails', () => {

        const message = 'This username is already registered.';

        handler.parseResponse(JSON.stringify([{ loggedin: false, message }]));

        expect(handler.result).to.be.deep.eq([{ 'Status': CliStatus.ERROR, 'Message': message }]);
    });

    it('should save user token', () => {

        sandbox.stub(helpers, 'saveToken').returns(true);

        handler.saveToken();

        expect(handler.result).to.be.deep.eq([]);
    });

    it('should return expected result if error when saving user token', () => {

        sandbox.stub(helpers, 'saveToken').throws(new Error('fake error'));

        handler.saveToken();

        expect(handler.result).to.be.deep.eq([{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': 'Login failed: fake error' }]);
    });

    it('should return expected result if problem with saving user token', () => {

        sandbox.stub(helpers, 'saveToken').returns(false);

        handler.saveToken();

        expect(handler.result).to.be.deep.eq([{ 'Status': CliStatus.ERROR, 'Message': 'Login failed' }]);
    });
});
