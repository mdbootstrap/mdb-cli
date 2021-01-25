'use strict';

const SocialAuthStrategy = require('../../../../receivers/strategies/auth/social-auth-strategy');
const AuthStrategy = require('../../../../receivers/strategies/auth/auth-strategy');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../../../helpers');


describe('Strategy: SocialAuthStrategy', () => {

    let strategy, saveTokenStub;

    beforeEach(() => {

        saveTokenStub = sandbox.stub(AuthStrategy.prototype, 'saveToken');
        sandbox.stub(helpers, 'createTextPrompt').resolves('fake.user.token');
        sandbox.stub(SocialAuthStrategy.prototype, 'openSocialLoginBrowser');
        strategy = new SocialAuthStrategy();
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should throw Error if register method is not implemented', () => {

        try {
            const result = strategy.socialAuthUrl;
        } catch (err) {
            expect(err.message).to.equal('You must declare socialAuthUrl getter!');
            return;
        }
        chai.assert.fail('SocialAuthStrategy should throw an error');
    });

    it('should login user and return expected result', async () => {

        sandbox.stub(strategy, 'socialAuthUrl').value('fakeUrl');
        saveTokenStub.returns(true);

        const result = await strategy.login();

        expect(result).to.be.null;
    });

    it('should return expected result if login fails', async () => {

        const expectedResult = 'Login failed. Could not save token.';
        sandbox.stub(strategy, 'socialAuthUrl').value('fakeUrl');
        saveTokenStub.returns(false);

        const result = await strategy.login();

        expect(result).to.be.eq(expectedResult);
    });
});