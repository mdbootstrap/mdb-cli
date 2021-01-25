'use strict';

const open = require('open');
const AuthStrategy = require('./auth-strategy');
const helpers = require('../../../helpers');

class SocialAuthStrategy extends AuthStrategy {

    get socialAuthUrl() {
        throw new Error('You must declare socialAuthUrl getter!');
    }

    async login() {
        this.openSocialLoginBrowser(this.socialAuthUrl);
        const token = await this.askCredentials();
        const saved = this.saveToken(token);
        return saved ? null : 'Login failed. Could not save token.';
    }

    openSocialLoginBrowser(url) {
        open(url);
    }

    async askCredentials() {
        return helpers.createTextPrompt('Enter text copied from web browser', 'It cannot be empty.');
    }
}

module.exports = SocialAuthStrategy;
