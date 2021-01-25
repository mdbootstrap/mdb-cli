'use strict';

const SocialAuthStrategy = require('./social-auth-strategy');
const config = require('../../../config');

class GoogleAuthStrategy extends SocialAuthStrategy {

    get socialAuthUrl() {
        return config.auth.social.google.url;
    }
}

module.exports = GoogleAuthStrategy;
