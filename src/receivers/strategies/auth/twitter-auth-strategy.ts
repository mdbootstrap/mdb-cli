import { SocialAuthStrategy } from './social-auth-strategy';
import config from '../../../config';

export class TwitterAuthStrategy extends SocialAuthStrategy {

    get socialAuthUrl() {
        return config.auth.social.twitter.url as string;
    }

    register(): Promise<string> {
        return this.login();
    }
}
