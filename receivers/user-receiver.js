'use strict';

const Receiver = require('./receiver');
const AuthMethod = require('../models/auth-method');
const NormalAuthStrategy = require('./strategies/auth/normal-auth-strategy');
const GoogleAuthStrategy = require('./strategies/auth/google-auth-strategy');
const FacebookAuthStrategy = require('./strategies/auth/facebook-auth-strategy');
const TwitterAuthStrategy = require('./strategies/auth/twitter-auth-strategy');
const atob = require('atob');

class UserReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.socialProvider = AuthMethod.Normal;
        this.authStrategy = null;
        this.context.registerNonArgFlags(['help']);
        this.context.registerFlagExpansions({
            '-u': '--username',
            '-p': '--password',
            '-m': '--method',
            '-h': '--help'
        });
        this.flags = this.context.getParsedFlags();
    }

    async register() {
        this.setAuthStrategy();

        const err = await this.authStrategy.register();
        if (err) {
            this.result.addAlert('red', 'Error', err);
        } else {
            this.result.addTextLine('Successfully registered.');
        }
    }

    async login() {
        this.setSocialProvider();
        this.setAuthStrategy();

        const err = await this.authStrategy.login();
        if (err) {
            this.result.addAlert('red', 'Error', err);
        } else {
            this.result.addTextLine('Successfully logged in.');
        }
    }

    async logout() {
        this.setAuthStrategy();

        const err = await this.authStrategy.logout();
        if (err) {
            this.result.addAlert('red', 'Error', err);
        } else {
            this.result.addTextLine('Successfully logged out.');
        }
    }

    async whoami() {
        this.context.authenticateUser();

        const token = this.context.userToken;
        const [, jwtBody] = token.split('.');
        const username = JSON.parse(atob(jwtBody)).name;

        this.result.addTextLine(username);
    }

    setSocialProvider() {

        const supportedMethods = [AuthMethod.Google, AuthMethod.Facebook, AuthMethod.Twitter, AuthMethod.Normal];
        if (this.flags.method && !supportedMethods.includes(this.flags.method)) {
            throw new Error(`Unsupported --method provided: ${this.flags.method}. Supported methods: ${supportedMethods.join(', ')}`);
        } else if (this.flags.method) {
            this.socialProvider = this.flags.method;
        }
    }

    setAuthStrategy() {

        switch (this.socialProvider) {
            case AuthMethod.Google: return this.authStrategy = new GoogleAuthStrategy();
            case AuthMethod.Facebook: return this.authStrategy = new FacebookAuthStrategy();
            case AuthMethod.Twitter: return this.authStrategy = new TwitterAuthStrategy();
            case AuthMethod.Normal: return this.authStrategy = new NormalAuthStrategy(this.flags, this.result);
            default: return this.authStrategy = new NormalAuthStrategy(this.flags, this.result);
        }
    }
}

module.exports = UserReceiver;

