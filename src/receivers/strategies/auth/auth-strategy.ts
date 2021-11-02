import fs from 'fs';
import path from 'path';
import config from '../../../config';

const { tokenDir, tokenFile } = config;

export abstract class AuthStrategy {

    abstract register(): Promise<string>;

    abstract login(): Promise<string>;

    logout() {
        return this.removeToken();
    }

    saveToken(userToken: string): boolean {

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

    removeToken(): null | string {

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
