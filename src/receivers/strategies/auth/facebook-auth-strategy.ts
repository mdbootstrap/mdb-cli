import { SocialAuthStrategy } from './social-auth-strategy';
import config from '../../../config';

export class FacebookAuthStrategy extends SocialAuthStrategy {

    get socialAuthUrl() {
        return config.auth.social.facebook.url as string;
    }

    register(): Promise<string> {
        return this.login();
    }
}
