'use strict';

import SocialAuthStrategy from "./social-auth-strategy";
import config from "../../../config";

class TwitterAuthStrategy extends SocialAuthStrategy {

    get socialAuthUrl() {
        return config.auth.social.twitter.url as string;
    }

    register(): Promise<string> {
        return this.login();
    }
}

export default TwitterAuthStrategy;
