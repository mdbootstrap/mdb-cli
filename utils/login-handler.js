'use strict';

const AuthHandler = require('./auth-handler');
const CliStatus = require('../models/cli-status');
const LoginStrategy = require('../models/login-strategy');
const NormalLoginStrategy = require('./strategies/login/normal-login-strategy');
const GoogleLoginStrategy = require('./strategies/login/google-login-strategy');
const FacebookLoginStrategy = require('./strategies/login/facebook-login-strategy');
const TwitterLoginStrategy = require('./strategies/login/twitter-login-strategy');
const helpers = require('../helpers/');

class LoginHandler {

    constructor(response, authHandler = new AuthHandler(false)) {

        this.result = response;
        this._userToken = '';

        this.authHandler = authHandler;

        this.socialProvider = LoginStrategy.Normal;

        this.strategy = null;
    }

    getResult() {

        return this.result;
    }

    setArgs(args) {

        const methodArg = args.find((arg) => arg.startsWith('--method='));
        if (!methodArg) {
            return;
        }

        const [, provider] = methodArg.split('=');
        this.socialProvider = provider.toLowerCase();
    }

    setStrategy() {
        switch (this.socialProvider) {
            case LoginStrategy.Google: return this.strategy = new GoogleLoginStrategy();
            case LoginStrategy.Facebook: return this.strategy = new FacebookLoginStrategy();
            case LoginStrategy.Twitter: return this.strategy = new TwitterLoginStrategy();
            case LoginStrategy.Normal: return this.strategy = new NormalLoginStrategy();
        }
    }

    login() {

        return this.strategy.login();
    }

    parseResponse(response) {

        response = typeof response === 'string' ? JSON.parse(response) : response;
        const [{ token }] = response;
        this._userToken = token;
    }

    saveToken() {

        try {

            const saved = helpers.saveToken(this._userToken);

            if (saved) {

                this.result = [{ 'Status': CliStatus.SUCCESS, 'Message': 'Login successful' }];
            } else {

                this.result = [{ 'Status': CliStatus.ERROR, 'Message': 'Login failed' }];
            }
        } catch (e) {

            this.result = [{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Login failed: ${e.message}` }];
        }
    }

}

module.exports = LoginHandler;

