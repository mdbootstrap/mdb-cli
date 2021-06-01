import crypto from "crypto";

export function generateRandomString(length = 8) {

    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}
