import config from '../../../../config'
import { FacebookAuthStrategy } from '../../../../receivers/strategies/auth';
import { createSandbox } from 'sinon';
import { expect } from 'chai';

describe('Strategy: FacebookAuthStrategy', () => {

    const sandbox = createSandbox();

    const fakeUrl = 'fakeFacebookUrl';

    it('should have a proper socialAuthUrl', () => {

        sandbox.stub(config.auth.social.facebook, 'url').value(fakeUrl);
        const strategy = new FacebookAuthStrategy();

        const result = strategy.socialAuthUrl;

        expect(result).to.be.eq(fakeUrl);
    });
});
