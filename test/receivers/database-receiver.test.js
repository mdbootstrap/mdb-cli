'use strict';

const config = require('../../config');
const Context = require('../../context');
const DatabaseReceiver = require('../../receivers/database-receiver');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const inquirer = require('inquirer');

describe('Receiver: database', () => {

    const fakeDb = {
        databaseId: 1,
        userId: 1,
        username: 'fakeUsername',
        database: 'mongodb',
        name: 'fakeDbName',
        description: 'fakeDesc',
        connectionString: 'mongodb://fakeUsername:password@mdbgo.dev:21017/fakeDbName'
    };

    let context, receiver, getDatabasesStub;

    beforeEach(() => {

        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: list', () => {

        it('should set expected result if user does not have any databases', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any databases yet.' };
            context = new Context('database', '', '', []);
            receiver = new DatabaseReceiver(context);
            sandbox.stub(receiver.http, 'get').resolves({ body: '[]' });

            await receiver.list();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if user has a database', async () => {

            const expectedResult = {
                type: 'table',
                value: [{
                    'Connection String': 'mongodb://fakeUsername:password@mdbgo.dev:21017/fakeDbName',
                    'Database': 'mongodb',
                    'Description': 'fakeDesc',
                    'Name': 'fakeDbName',
                    'Username': 'fakeUsername'
                }]
            };
            sandbox.stub(DatabaseReceiver.prototype, 'getDatabases').resolves([fakeDb]);
            context = new Context('database', 'list', '', []);
            receiver = new DatabaseReceiver(context);

            await receiver.list();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: init', () => {

        let createConfirmationPromptStub, createPromptModuleStub, promptStub, postStub;

        beforeEach(() => {

            createConfirmationPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt');
            promptStub = sandbox.stub().resolves({ username: 'fakeUser', password: 'fakePass', repeatPassword: 'fakePass', name: 'fakeName', description: 'fakeDesc' });
            createPromptModuleStub = sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
            sandbox.stub(config, 'databases').value(['mysql8', 'mongodb']);
            context = new Context('database', 'init', '', ['--database', 'mysql8']);
            receiver = new DatabaseReceiver(context);
            postStub = sandbox.stub(receiver.http, 'post');
        });

        it('should return expected result if database is not supported', async () => {

            const expectedResult = { type: 'text', value: 'This database is not supported. Allowed technologies: mysql8, mongodb' };
            receiver.flags.database = 'fakeDatabase';

            await receiver.init();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should return expected result if user doesn\'t want to create database user', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Warning!', body: 'Cannot create database without a database user.' }, color: 'yellow' };
            sandbox.stub(helpers, 'createListPrompt').resolves('mysql8');
            createConfirmationPromptStub.resolves(false);
            receiver.flags.database = undefined;

            await receiver.init();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should return expected result if mongo database was created', async () => {

            const expectedResult = [
                { type: 'alert', value: { title: '\nWarning!', body: 'Write down the password to your database as we will never show it again.\n' }, color: 'red' },
                { type: 'alert', value: { title: 'Info:', body: 'To connect to this database you need to download Robo3T or another MongoDB client\n' }, color: 'blue' },
                { type: 'table', value: [{ Username: 'fakeUsername', Password: 'fakePass', 'Database Name': 'fakeDbName', 'Connection String': 'mongodb://fakeUsername:password@mdbgo.dev:21017/fakeDbName' }] }
            ];
            createConfirmationPromptStub.resolves(true);
            postStub.resolves({ body: JSON.stringify({ ...fakeDb, ...{ password: 'fakePass' } }) });

            await receiver.init();

            expect(receiver.result.messages).to.deep.include(expectedResult[0]);
            expect(receiver.result.messages).to.deep.include(expectedResult[1]);
            expect(receiver.result.messages).to.deep.include(expectedResult[2]);
        });

        it('should return expected result if mysql8 database was created', async () => {

            const expectedResult = [
                { type: 'alert', value: { title: '\nWarning!', body: 'Write down the password to your database as we will never show it again.\n' }, color: 'red' },
                { type: 'alert', value: { title: 'Info:', body: 'You can manage your database with phpMyAdmin at https://phpmyadmin.mdbgo.com/\n' }, color: 'blue' },
                { type: 'table', value: [{ Username: 'fakeUsername', Password: 'fakePass', 'Database Name': 'fakeDbName', 'Connection String': 'mongodb://fakeUsername:password@mdbgo.dev:21017/fakeDbName' }] }
            ];
            createConfirmationPromptStub.resolves(true);
            postStub.resolves({ body: JSON.stringify({ ...fakeDb, ...{ password: 'fakePass', database: 'mysql8' } }) });

            await receiver.init();

            expect(receiver.result.messages).to.deep.include(expectedResult[0]);
            expect(receiver.result.messages).to.deep.include(expectedResult[1]);
            expect(receiver.result.messages).to.deep.include(expectedResult[2]);
        });
    });

    describe('Method: delete', () => {

        beforeEach(() => {

            getDatabasesStub = sandbox.stub(DatabaseReceiver.prototype, 'getDatabases');
        });

        it('should set expected result if user does not have any databases', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any databases yet.' };
            getDatabasesStub.resolves([]);
            context = new Context('database', 'delete', '', []);
            receiver = new DatabaseReceiver(context);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if database not found', async () => {

            const expectedResult = { type: 'text', value: 'Database fakeDb not found.' };
            getDatabasesStub.resolves([fakeDb]);
            context = new Context('database', 'delete', '', ['-n', 'fakeDb']);
            receiver = new DatabaseReceiver(context);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if user has a database', async () => {

            const expectedResult = { type: 'alert', value: { title: '\nResult:', body: 'Database successfully deleted.\n' }, color: 'green' };
            getDatabasesStub.resolves([fakeDb]);
            context = new Context('database', 'delete', '', []);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeDbName');
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakeDbName');
            receiver = new DatabaseReceiver(context);
            sandbox.stub(receiver.http, 'delete').resolves();

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if user type invalid database name', async () => {

            const expectedResult = { type: 'text', value: 'The names do not match.' };
            getDatabasesStub.resolves([fakeDb]);
            context = new Context('database', 'delete', '', []);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeDbName');
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakeDb');
            receiver = new DatabaseReceiver(context);
            sandbox.stub(receiver.http, 'delete').resolves();

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error:', body: 'Fake error' }, color: 'red' };
            getDatabasesStub.resolves([fakeDb]);
            context = new Context('database', 'delete', '', []);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeDbName');
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakeDbName');
            receiver = new DatabaseReceiver(context);
            sandbox.stub(receiver.http, 'delete').rejects({ message: 'Fake error' });

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: info', () => {

        beforeEach(() => {

            getDatabasesStub = sandbox.stub(DatabaseReceiver.prototype, 'getDatabases');
        });

        it('should set expected result if user does not have any databases', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any databases yet.' };
            getDatabasesStub.resolves([]);
            context = new Context('database', 'info', '', []);
            receiver = new DatabaseReceiver(context);

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if database not found', async () => {

            const expectedResult = { type: 'text', value: 'Database fakeDb not found.' };
            getDatabasesStub.resolves([fakeDb]);
            context = new Context('database', 'info', '', ['-n', 'fakeDb']);
            receiver = new DatabaseReceiver(context);

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if user has a database', async () => {

            const expectedResult = [{
                type: 'alert',
                value: { title: '\nConnection String:', body: 'mongodb://fakeUsername:password@mdbgo.dev:21017/fakeDbName' },
                color: 'turquoise'
            }, {
                type: 'alert',
                value: { title: '\nInfo:', body: 'The connection string above does not show the password for your database user. You have to replace the \'<password>\' string with your real password in order to connect to the database.\n' },
                color: 'blue'
            }];
            getDatabasesStub.resolves([fakeDb]);
            context = new Context('database', 'info', '', []);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeDbName')
            receiver = new DatabaseReceiver(context);

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult[0]);
            expect(receiver.result.messages).to.deep.include(expectedResult[1]);
        });
    });
});