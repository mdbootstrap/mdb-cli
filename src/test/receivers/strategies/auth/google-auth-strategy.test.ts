import config from '../../../../config';
import GoogleAuthStrategy from '../../../../receivers/strategies/auth/google-auth-strategy';
import { createSandbox } from 'sinon';
import { expect } from 'chai';

describe('Strategy: GoogleAuthStrategy', () => {

    const sandbox = createSandbox();

    const fakeUrl = 'fakeGoogleUrl';

    it('should have a proper socialAuthUrl', () => {

        sandbox.stub(config.auth.social.google, 'url').value(fakeUrl);
        const strategy = new GoogleAuthStrategy();

        const result = strategy.socialAuthUrl;

        expect(result).to.be.eq(fakeUrl);
    });
});
