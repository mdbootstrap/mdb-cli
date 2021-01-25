'use strict';

const config = require('../../../../config');
const FacebookAuthStrategy = require('../../../../receivers/strategies/auth/facebook-auth-strategy');
const sandbox = require('sinon').createSandbox();


describe('Strategy: FacebookAuthStrategy', () => {

    const fakeUrl = 'fakeFacebookUrl';

    it('should have a proper socialAuthUrl', () => {

        sandbox.stub(config.auth.social.facebook, 'url').value(fakeUrl);
        const strategy = new FacebookAuthStrategy();

        const result = strategy.socialAuthUrl;

        expect(result).to.be.eq(fakeUrl);
    });
});
