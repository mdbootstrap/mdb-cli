'use strict';

const config = require('../../../../config');
const GoogleAuthStrategy = require('../../../../receivers/strategies/auth/google-auth-strategy');
const sandbox = require('sinon').createSandbox();


describe('Strategy: GoogleAuthStrategy', () => {

    const fakeUrl = 'fakeGoogleUrl';

    it('should have a proper socialAuthUrl', () => {

        sandbox.stub(config.auth.social.google, 'url').value(fakeUrl);
        const strategy = new GoogleAuthStrategy();

        const result = strategy.socialAuthUrl;

        expect(result).to.be.eq(fakeUrl);
    });
});
