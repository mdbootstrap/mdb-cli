import config from '../../../../config';
import TwitterAuthStrategy from '../../../../receivers/strategies/auth/twitter-auth-strategy';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';
import AuthStrategy from "../../../../receivers/strategies/auth/auth-strategy";
import helpers from "../../../../helpers";

describe('Strategy: TwitterAuthStrategy', () => {

    const sandbox = createSandbox();

    const fakeUrl = 'fakeTwitterUrl';

    let strategy: TwitterAuthStrategy,
        saveTokenStub: SinonStub;

    beforeEach(() => {

        saveTokenStub = sandbox.stub(AuthStrategy.prototype, 'saveToken');
        sandbox.stub(helpers, 'createTextPrompt').resolves('fake.user.token');
        sandbox.stub(TwitterAuthStrategy.prototype, 'openSocialLoginBrowser');
        strategy = new TwitterAuthStrategy();
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have a proper socialAuthUrl', () => {

        sandbox.stub(config.auth.social.twitter, 'url').value(fakeUrl);

        const result = strategy.socialAuthUrl;

        expect(result).to.be.eq(fakeUrl);
    });

    it('should login user and return expected result', async () => {

        const strategy = new TwitterAuthStrategy();
        sandbox.stub(strategy, 'socialAuthUrl').value('fakeUrl');
        saveTokenStub.returns(true);

        const result = await strategy.login();

        expect(result).to.be.eq('');
    });

    it('should return expected result if login fails', async () => {

        const expectedResult = 'Login failed. Could not save token.';
        sandbox.stub(strategy, 'socialAuthUrl').value('fakeUrl');
        saveTokenStub.returns(false);

        const result = await strategy.login();

        expect(result).to.be.eq(expectedResult);
    });
});
