'use strict';

const SocialAuthStrategy = require('./social-auth-strategy');
const config = require('../../../config');

class FacebookAuthStrategy extends SocialAuthStrategy {

    get socialAuthUrl() {
        return config.auth.social.facebook.url;
    }
}

module.exports = FacebookAuthStrategy;
