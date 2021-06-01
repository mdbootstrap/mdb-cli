'use strict';

import inquirer from "inquirer";
import AuthStrategy from "./auth-strategy";
import HttpWrapper, {CustomRequestOptions} from "../../../utils/http-wrapper";
import config from "../../../config";
import CommandResult from "../../../utils/command-result";

class NormalAuthStrategy extends AuthStrategy {

    public result: CommandResult;
    public flags: { [key: string]: string };

    private options: CustomRequestOptions = {
        hostname: config.host,
        path: '/auth/login',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    constructor(flags: { [key: string]: string }, result: CommandResult) {
        super();

        this.result = result;
        this.flags = flags;
    }

    async login(): Promise<string> {
        await this.askLoginCredentials();

        const http = new HttpWrapper();

        try {
            const result = await http.post(this.options);
            const [{ token, message }] = JSON.parse(result.body);
            if (token) {
                const saved = this.saveToken(token);
                return saved ? '' : 'Login failed. Could not save token.';
            }

            return `Login failed: ${message}`;
        } catch (e) {
            return `Login failed: ${e.message}`;
        }
    }

    async askLoginCredentials() {

        const prompt = inquirer.createPromptModule();

        const { username } = this.flags.username ? { username: this.flags.username } : await prompt([
            {
                type: 'text',
                message: 'Enter your MDB username',
                name: 'username',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value);
                    /* istanbul ignore next */
                    return valid || 'Login must not be empty.';
                }
            }
        ]);
        const { password } = this.flags.password ? { password: this.flags.password } : await prompt([
            {
                type: 'password',
                message: 'Enter your MDB password',
                name: 'password',
                mask: '*',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value);
                    /* istanbul ignore next */
                    return valid || 'Password must not be empty.';
                }
            }
        ]);
        this.options.data = JSON.stringify({ username, password });
        this.options.headers!['Content-Length'] = Buffer.byteLength(this.options.data);
    }

    async register() {
        await this.askRegisterCredentials();

        this.result.liveTextLine('Processing...');

        const http = new HttpWrapper();

        try {
            const result = await http.post(this.options);
            const [{ token, loggedin, message }] = JSON.parse(result.body);
            if (loggedin) {
                const saved = this.saveToken(token);
                return saved ? '' : 'Registration succeeded but the token could not be saved. Try to log in again.';
            }

            return `Could not log in: ${message}`;
        } catch (e) {
            return `Registration failed: ${e.message}`;
        }
    }

    async askRegisterCredentials() {

        const prompt = inquirer.createPromptModule();

        let passwordValue = '';

        const answers = await prompt([
            {
                type: 'text',
                message: 'Enter your name',
                name: 'name',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && /^[^()!|&*]+$/.test(value);
                    /* istanbul ignore next */
                    return valid || 'Name is invalid.';
                }
            },
            {
                type: 'text',
                message: 'Enter username',
                name: 'username',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && /^[^()!|&*]+$/.test(value);
                    /* istanbul ignore next */
                    return valid || 'Username is invalid.';
                }
            },
            {
                type: 'text',
                message: 'Enter email',
                name: 'email',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
                    /* istanbul ignore next */
                    return valid || 'Please enter a valid email.';
                }
            },
            {
                type: 'password',
                message: 'Enter password',
                name: 'password',
                mask: '*',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && typeof value === 'string' && value.length > 7;
                    passwordValue = value;
                    /* istanbul ignore next */
                    return valid || 'Password is invalid, it should contain at least 8 characters.';
                }
            },
            {
                type: 'password',
                message: 'Repeat password',
                name: 'repeatPassword',
                mask: '*',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && typeof value === 'string' && value === passwordValue;
                    /* istanbul ignore next */
                    return valid || 'Passwords do not match.';
                }
            }
        ]);

        this.options.path = '/auth/register';
        this.options.data = JSON.stringify(answers);
        this.options.headers!['Content-Length'] = Buffer.byteLength(this.options.data);
    }
}

export default NormalAuthStrategy;
