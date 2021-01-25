'use strict';

const config = require('../../../../config');
const TwitterAuthStrategy = require('../../../../receivers/strategies/auth/twitter-auth-strategy');
const sandbox = require('sinon').createSandbox();


describe('Strategy: TwitterAuthStrategy', () => {

    const fakeUrl = 'fakeTwitterUrl';

    it('should have a proper socialAuthUrl', () => {

        sandbox.stub(config.auth.social.twitter, 'url').value(fakeUrl);
        const strategy = new TwitterAuthStrategy();

        const result = strategy.socialAuthUrl;

        expect(result).to.be.eq(fakeUrl);
    });
});
