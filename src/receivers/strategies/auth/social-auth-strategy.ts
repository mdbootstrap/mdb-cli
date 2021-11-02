import open from 'open';
import { AuthStrategy } from './auth-strategy';
import helpers from '../../../helpers';

export abstract class SocialAuthStrategy extends AuthStrategy {

    abstract get socialAuthUrl(): string;

    async login(): Promise<string> {
        this.openSocialLoginBrowser(this.socialAuthUrl);
        const token = await this.askCredentials();
        const saved = this.saveToken(token);
        return saved ? '' : 'Login failed. Could not save token.';
    }

    openSocialLoginBrowser(url: string) {
        open(url);
    }

    async askCredentials() {
        return helpers.createTextPrompt('Enter text copied from web browser', 'It cannot be empty.');
    }
}
