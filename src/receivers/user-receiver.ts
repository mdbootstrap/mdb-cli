'use strict';

import atob from 'atob';
import Context from '../context';
import Receiver from './receiver';
import AuthMethod from '../models/auth-method';
import { OutputColor } from '../models/output-color';
import NormalAuthStrategy from './strategies/auth/normal-auth-strategy';
import GoogleAuthStrategy from './strategies/auth/google-auth-strategy';
import FacebookAuthStrategy from './strategies/auth/facebook-auth-strategy';
import TwitterAuthStrategy from './strategies/auth/twitter-auth-strategy';


class UserReceiver extends Receiver {

    private socialProvider: AuthMethod;
    private authStrategy: NormalAuthStrategy | GoogleAuthStrategy | FacebookAuthStrategy | TwitterAuthStrategy | null = null;

    constructor(context: Context) {
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

    async register(): Promise<void> {
        this.setAuthStrategy();

        const err = await this.authStrategy!.register();
        if (err) {
            this.result.addAlert(OutputColor.Red, 'Error', err);
        } else {
            this.result.addTextLine('Successfully registered.');
        }
    }

    async login(): Promise<void> {
        this.setSocialProvider();
        this.setAuthStrategy();

        const err = await this.authStrategy!.login();
        if (err) {
            this.result.addAlert(OutputColor.Red, 'Error', err);
        } else {
            this.result.addTextLine('Successfully logged in.');
        }
    }

    async logout(): Promise<void> {
        this.setAuthStrategy();

        const err = await this.authStrategy!.logout();
        if (err) {
            this.result.addAlert(OutputColor.Red, 'Error', err);
        } else {
            this.result.addTextLine('Successfully logged out.');
        }
    }

    async whoami(): Promise<void> {
        this.context.authenticateUser();

        const token = this.context.userToken;
        const [, jwtBody] = token.split('.');
        const username = JSON.parse(atob(jwtBody)).name;

        this.result.addTextLine(username);
    }

    setSocialProvider(): void {

        const supportedMethods = [AuthMethod.Google, AuthMethod.Facebook, AuthMethod.Twitter, AuthMethod.Normal];
        if (this.flags.method && !supportedMethods.includes(this.flags.method as AuthMethod)) {
            throw new Error(`Unsupported --method provided: ${this.flags.method}. Supported methods: ${supportedMethods.join(', ')}`);
        } else if (this.flags.method) {
            this.socialProvider = this.flags.method as AuthMethod;
        }
    }

    setAuthStrategy(): NormalAuthStrategy | GoogleAuthStrategy | FacebookAuthStrategy | TwitterAuthStrategy {

        switch (this.socialProvider) {
            case AuthMethod.Google: return this.authStrategy = new GoogleAuthStrategy();
            case AuthMethod.Facebook: return this.authStrategy = new FacebookAuthStrategy();
            case AuthMethod.Twitter: return this.authStrategy = new TwitterAuthStrategy();
            case AuthMethod.Normal: return this.authStrategy = new NormalAuthStrategy(this.flags as { [key: string]: string }, this.result);
            default: return this.authStrategy = new NormalAuthStrategy(this.flags as { [key: string]: string }, this.result);
        }
    }
}

export default UserReceiver;