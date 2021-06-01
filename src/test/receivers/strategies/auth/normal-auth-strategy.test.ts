import inquirer from 'inquirer';
import config from '../../../../config';
import Receiver from '../../../../receivers/receiver';
import HttpWrapper from '../../../../utils/http-wrapper';
import AuthStrategy from '../../../../receivers/strategies/auth/auth-strategy';
import NormalAuthStrategy from '../../../../receivers/strategies/auth/normal-auth-strategy';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Strategy: NormalAuthStrategy', () => {

    const sandbox = createSandbox();

    let strategy: NormalAuthStrategy,
        saveTokenStub: SinonStub,
        createPromptModuleStub: SinonStub,
        postStub: SinonStub,
        promptStub: SinonStub,
        receiver: Receiver;

    beforeEach(() => {

        createPromptModuleStub = sandbox.stub(inquirer, 'createPromptModule');
        saveTokenStub = sandbox.stub(AuthStrategy.prototype, 'saveToken');
        postStub = sandbox.stub(HttpWrapper.prototype, 'post');
        sandbox.stub(config, 'host').value('fakeHost');
        sandbox.stub(config, 'port').value('fakePort');
        // @ts-ignore
        receiver = new Receiver();
        strategy = new NormalAuthStrategy({}, receiver.result);
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

            expect(result).to.be.equal('');
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

            expect(result).to.be.equal('');
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
