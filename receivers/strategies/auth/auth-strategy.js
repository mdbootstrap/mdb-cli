'use strict';

const fs = require('fs');
const path = require('path');
const { tokenDir, tokenFile } = require('../../../config');

class AuthStrategy {

    constructor() { }

    register() {
        throw new Error('You must implement the register() method!');
    }

    login() {
        throw new Error('You must implement the login() method!');
    }

    logout() {
        return this.removeToken();
    }

    saveToken(userToken) {

        if (userToken) {

            const tokenPath = path.join(tokenDir, tokenFile);

            try {

                fs.mkdirSync(tokenDir, { recursive: true, mode: 0o755 });
                fs.writeFileSync(tokenPath, userToken, { encoding: 'utf8', mode: 0o644 });
            } catch (err) {

                return false;
            }

            return true;
        }

        return false;
    }

    removeToken() {

        const tokenPath = path.join(tokenDir, tokenFile);

        try {
            fs.unlinkSync(tokenPath);

            return null;
        } catch (e) {

            if (e.code === 'ENOENT') return 'You are not logged in.';

            return `Logout failed: ${e.message}`;
        }
    }
}

module.exports = AuthStrategy;
