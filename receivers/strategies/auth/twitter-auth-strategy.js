'use strict';

const SocialAuthStrategy = require('./social-auth-strategy');
const config = require('../../../config');

class TwitterAuthStrategy extends SocialAuthStrategy {

    get socialAuthUrl() {
        return config.auth.social.twitter.url;
    }
}

module.exports = TwitterAuthStrategy;
