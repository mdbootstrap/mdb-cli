'use strict';

const open = require('open');
const config = require('../../../config');

class FacebookLoginStrategy {

    async login() {

        this.openSocialLoginBrowser();

        const token = await this.askCredentials();

        return [{ token }];
    }

    openSocialLoginBrowser() {
        open(config.auth.social.facebook.url);
    }

    askCredentials() {

        const prompt = require('inquirer').createPromptModule();

        return prompt([
            {
                type: 'text',
                message: 'Enter text copied from web browser',
                name: 'token'
            }
        ])
            .then(({ token }) => token);
    }
}

module.exports = FacebookLoginStrategy;
