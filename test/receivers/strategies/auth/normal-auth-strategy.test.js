'use strict';

const NormalAuthStrategy = require('../../../../receivers/strategies/auth/normal-auth-strategy');
const AuthStrategy = require('../../../../receivers/strategies/auth/auth-strategy');
const HttpWrapper = require('../../../../utils/http-wrapper');
const sandbox = require('sinon').createSandbox();
const config = require('../../../../config');
const inquirer = require('inquirer');


describe('Strategy: NormalAuthStrategy', () => {

    let strategy, saveTokenStub, createPromptModuleStub, postStub, promptStub;

    beforeEach(() => {

        createPromptModuleStub = sandbox.stub(inquirer, 'createPromptModule');
        saveTokenStub = sandbox.stub(AuthStrategy.prototype, 'saveToken');
        postStub = sandbox.stub(HttpWrapper.prototype, 'post');
        sandbox.stub(config, 'host').value('fakeHost');
        sandbox.stub(config, 'port').value('fakePort');
        strategy = new NormalAuthStrategy();
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('login', () => {

        beforeEach(() => {

            promptStub = sandbox.stub().resolves({ username: 'fakeUsername', password: 'fakePassword' });
            createPromptModuleStub.returns(promptStub);
        });

        it('should login user and return expected result', async () => {

            postStub.resolves({ body: JSON.stringify([{ token: 'fake.user.token' }]) });
            saveTokenStub.returns(true);

            const result = await strategy.login();

            expect(result).to.be.null;
        });

        it('should return expected result if error saving token', async () => {

            const expectedResult = 'Login failed. Could not save token.';
            postStub.resolves({ body: JSON.stringify([{ token: 'fake.user.token' }]) });
            saveTokenStub.returns(false);

            const result = await strategy.login();

            expect(result).to.be.eq(expectedResult);
        });

        it('should return expected result if login error', async () => {

            const expectedResult = 'Login failed: Fake message';
            postStub.resolves({ body: JSON.stringify([{ message: 'Fake message' }]) });

            const result = await strategy.login();

            expect(result).to.be.eq(expectedResult);
        });

        it('should return expected result if request fails', async () => {

            const expectedResult = 'Login failed: Fake error';
            postStub.rejects({ message: 'Fake error' });

            const result = await strategy.login();

            expect(result).to.be.eq(expectedResult);
        });
    });

    describe('register', () => {

        beforeEach(() => {

            promptStub = sandbox.stub().resolves({ name: 'fakeName', email: 'fake@email', username: 'fakeUsername', password: 'fakePassword', repeatPassword: 'fakePassword' });
            createPromptModuleStub.returns(promptStub);
        });

        it('should register user and return expected result', async () => {

            postStub.resolves({ body: JSON.stringify([{ token: 'fake.user.token', loggedin: true }]) });
            saveTokenStub.returns(true);

            const result = await strategy.register();

            expect(result).to.be.null;
        });

        it('should return expected result if error saving token', async () => {

            const expectedResult = 'Registration succeeded but the token could not be saved. Try to log in again.';
            postStub.resolves({ body: JSON.stringify([{ token: 'fake.user.token', loggedin: true }]) });
            saveTokenStub.returns(false);

            const result = await strategy.register();

            expect(result).to.be.eq(expectedResult);
        });

        it('should return expected result if registration error', async () => {

            const expectedResult = 'Could not log in: Fake message';
            postStub.resolves({ body: JSON.stringify([{ message: 'Fake message', loggedin: false }]) });

            const result = await strategy.register();

            expect(result).to.be.eq(expectedResult);
        });

        it('should return expected result if request fails', async () => {

            const expectedResult = 'Registration failed: Fake error';
            postStub.rejects({ message: 'Fake error' });

            const result = await strategy.register();

            expect(result).to.be.eq(expectedResult);
        });
    });
});