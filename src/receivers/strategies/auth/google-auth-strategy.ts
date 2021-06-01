'use strict';

import SocialAuthStrategy from "./social-auth-strategy";
import config from "../../../config";

class GoogleAuthStrategy extends SocialAuthStrategy {

    get socialAuthUrl() {
        return config.auth.social.google.url as string;
    }

    register(): Promise<string> {
        return this.login();
    }
}

export default GoogleAuthStrategy;
