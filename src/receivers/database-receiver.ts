'use strict';

import inquirer from 'inquirer';
import config from '../config';
import Context from '../context';
import Receiver from './receiver';
import helpers from '../helpers';
import { Database, OutputColor } from '../models';
import { CustomRequestOptions } from '../utils/http-wrapper';


class DatabaseReceiver extends Receiver {

    private args: string[];
    public options: CustomRequestOptions;

    constructor(context: Context) {
        super(context);

        this.context.authenticateUser();

        this.options = {
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };

        this.context.registerNonArgFlags(['all', 'force', 'help', 'many']);
        this.context.registerFlagExpansions({
            '-db': '--database',
            '-n': '--name',
            '-h': '--help',
            '-u': '--username',
            '-p': '--password',
            '-d': '--description'
        });

        this.flags = this.context.getParsedFlags();
        this.args = this.context.args;
    }

    async list(): Promise<void> {

        this.result.liveTextLine('Fetching databases...');

        const databases = await this.getDatabases();

        if (databases.length) {

            const result = databases.map((db: Database) => ({
                'Database': db.database,
                'Name': db.name,
                'Username': db.username,
                'Hostname': db.host,
                'Connection String': db.connectionString,
                'Description': db.description
            }));

            this.result.addTable(result);

        } else {

            this.result.addTextLine('You don\'t have any databases yet.');
        }
    }

    async getDatabases(): Promise<Database[]> {

        this.options.path = '/databases';
        const result = await this.http.get(this.options);
        return JSON.parse(result.body);
    }

    async init(): Promise<void> {

        let database = this.flags.database as string || await helpers.createListPrompt('Choose database', config.databases);

        if (!config.databases.includes(database)) {
            return this.result.addTextLine(`This database is not supported. Allowed technologies: ${config.databases.join(', ')}`);
        }
        const confirmed = Boolean(this.flags.username) || await helpers.createConfirmationPrompt('In order to create a new database, you need to create the database user. Proceed?', true);

        if (!confirmed) {
            return this.result.addAlert(OutputColor.Yellow, 'Warning!', 'Cannot create database without a database user.');
        }

        const prompt = inquirer.createPromptModule();

        let passwordValue: string;

        const allFlags = this.flags.username && this.flags.password && this.flags.name;

        const answers = allFlags ? {
            name: this.flags.name,
            username: this.flags.username,
            password: this.flags.password,
            repeatPassword: this.flags.password,
            description: this.flags.description || ''
        } : await prompt([
            {
                type: 'text',
                message: 'Enter username',
                name: 'username',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && /^[a-z0-9_]+$/.test(value);
                    /* istanbul ignore next */
                    return valid || 'Username is invalid.';
                }
            },
            {
                type: 'password',
                message: 'Enter password',
                name: 'password',
                mask: '*',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(\W|_)).{8,}$/.test(value);
                    passwordValue = value;
                    /* istanbul ignore next */
                    return valid || 'Password is incorrect, it should contain at least one uppercase letter, at least one lowercase letter, at least one number, at least one special symbol and it should contain more than 7 characters.';
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
            },
            {
                type: 'text',
                message: 'Enter database name',
                name: 'name',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && /^[a-z0-9_]+$/.test(value);
                    /* istanbul ignore next */
                    return valid || 'Database name is invalid.';
                }
            },
            {
                type: 'text',
                message: 'Enter description',
                name: 'description'
            }
        ]);

        answers.database = database;

        this.options.data = JSON.stringify(answers);
        this.options.headers!['Content-Length'] = Buffer.byteLength(this.options.data);
        this.options.headers!['Content-Type'] = 'application/json';
        this.options.path = '/databases';

        let response;
        try {
            response = await this.http.post(this.options);
            response = JSON.parse(response.body);
        } catch (err: any) {
            const errMsg = `Could not create database: ${err.message || err}`;

            if (errMsg && errMsg.includes('Please upgrade your subscription plan')) {
                await this.showPricingLimitError(errMsg);
            } else {
                this.result.addAlert(OutputColor.Red, 'Error', `${errMsg}`);
            }

            return;
        }

        const mysqlMsg = `You can manage your database with phpMyAdmin at https://phpmyadmin.mdbgo.com/`;
        const mongoMsg = `To connect to this database you need to download Robo3T or another MongoDB client`;
        const msg = response.database === 'mysql8' ? mysqlMsg : mongoMsg;
        this.result.addAlert(OutputColor.Red, '\nWarning!', `Write down the password to your database as we will never show it again.\n`);
        this.result.addAlert(OutputColor.Blue, 'Info:', `${msg}\n`);
        this.result.addTable([{
            'Username': response.username,
            'Password': response.password,
            'Database Name': response.name,
            'Connection String': response.connectionString
        }]);
    }

    async delete() {
        const databases = await this.getDatabases();
        if (databases.length === 0) {
            return this.result.addTextLine('You don\'t have any databases yet.');
        }

        const dbName = this.flags.name || await helpers.createListPrompt('Choose database', databases);

        const database = databases.find(db => db.name === dbName);
        if (!database) {
            return this.result.addTextLine(`Database ${dbName} not found.`);
        }

        this.result.liveAlert(OutputColor.Red, '\nWarning!', 'This operation cannot be undone. If it\'s a misclick you can abort the operation with Ctrl + C\n');

        const name = await helpers.createTextPrompt('Confirm deleting selected database by typing its name:', 'Database name must not be empty.');
        if (name !== database.name) {
            return this.result.addTextLine('The names do not match.');
        }

        this.options.path = `/databases/${database.databaseId}`;
        try {
            await this.http.delete(this.options);
            this.result.addAlert(OutputColor.Green, '\nResult:', 'Database successfully deleted.\n');
        } catch (err: any) {
            this.result.addAlert(OutputColor.Red, 'Error:', err.message);
        }
    }

    async info() {
        let databases = await this.getDatabases();
        if (databases.length === 0) {
            return this.result.addTextLine('You don\'t have any databases yet.');
        }

        const dbName = this.flags.name || this.args[0] || await helpers.createListPrompt('Choose database', databases);

        const database = databases.find(db => db.name === dbName);
        if (!database) return this.result.addTextLine(`Database ${dbName} not found.`);

        this.result.addAlert(OutputColor.Turquoise, '\nConnection String:', database.connectionString);
        this.result.addAlert(OutputColor.Blue, '\nInfo:', 'The connection string above does not show the password for your database user. You have to replace the \'<password>\' string with your real password in order to connect to the database.\n');
    }

    async changeConfig() {

        const args = this.context.args;

        if (args[0] === 'password') {
            await this.changePassword();
        } else {
            this.result.addAlert(OutputColor.Red, 'Error:', 'Please provide valid argument!');
        }
    }

    async changePassword() {
        let databases = await this.getDatabases();
        if (databases.length === 0) {
            return this.result.addTextLine('You don\'t have any databases yet.');
        }

        const dbName = this.flags.name || await helpers.createListPrompt('Choose database', databases);

        const database = databases.find(db => db.name === dbName);
        if (!database) return this.result.addTextLine(`Database ${dbName} not found.`);
        this.options.path = '/databases/password/' + database.databaseId;

        await this.askForNewPassword();

        try {
            await this.http.put(this.options);
            this.result.addAlert(OutputColor.Green, '\nResult:', 'Database password successfully changed.\n');
        } catch (err: any) {
            this.result.addAlert(OutputColor.Red, 'Error:', err.message);
        }
    }

    async askForNewPassword() {

        const prompt = inquirer.createPromptModule();
        let passwordValue: string;

        const answers = await prompt([
            {
                type: 'password',
                message: 'Enter new db password',
                name: 'password',
                mask: '*',
                validate: (value) => {
                    /* istanbul ignore next */
                    const valid = Boolean(value) && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(\W|_)).{8,}$/.test(value);
                    passwordValue = value;
                    /* istanbul ignore next */
                    return valid || 'Password is incorrect, it should contain at least one uppercase letter, at least one lowercase letter, at least one number, at least one special symbol and it should contain more than 7 characters.';
                }
            },
            {
                type: 'password',
                message: 'Re-enter new db password',
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

        const { password, repeatPassword } = answers;

        if (password !== repeatPassword)
            throw new Error('Passwords do not match');

        this.options.data = JSON.stringify(answers);
        this.options.headers!['Content-Length'] = Buffer.byteLength(this.options.data);
        this.options.headers!['Content-Type'] = 'application/json';
    }

    async deleteMany(): Promise<void> {
        const databases = await this.getDatabases();
        if (databases.length === 0) {
            return this.result.addTextLine('You don\'t have any databases yet.');
        }

        const names: string[] = [];
        if (this.flags.all) {
            databases.forEach(db => names.push(db.name));
            const confirmed = this.flags.force || await helpers.createConfirmationPrompt('Are you sure you want to delete all your databases?', false);
            if (!confirmed) return;
        } else if (this.flags.many) {
            const selected = await helpers.createCheckboxPrompt('Select databases to remove', databases);
            if (selected.length === 0) return;
            selected.forEach(db => names.push(db));
        } else {
            this.context.args.forEach(a => names.push(a));
        }

        if (names.length === 0) {
            return this.result.addAlert(OutputColor.Red, 'Error', 'Databases names not provided.');
        }

        const ids: number[] = [];
        const notFound: string[] = [];
        names.forEach(name => {
            const db = databases.find(d => d.name === name);
            if (!db) return notFound.push(name);
            ids.push(db.databaseId);
        });

        if (notFound.length > 0) {
            return this.result.addAlert(OutputColor.Red, 'Error', `Database${notFound.length > 1 ? 's' : ''} ${notFound.join(', ')} not found.`);
        }

        const password = this.flags.password || await helpers.createPassPrompt('This operation cannot be undone. Please confirm it by entering your password', 'Password cannot be empty.');

        const data = JSON.stringify({ password, databases: ids });
        this.options = {
            hostname: config.host,
            headers: {
                'Authorization': `Bearer ${this.context.userToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            },
            path: '/databases/remove',
            data
        };

        try {
            await this.http.delete(this.options);
            this.result.addAlert(OutputColor.Green, 'Success', `Database${names.length > 1 ? 's' : ''} ${names.join(', ')} successfully deleted.`);
        } catch (err: any) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not delete: ${err.message}`);
        }
    }
}

export default DatabaseReceiver;