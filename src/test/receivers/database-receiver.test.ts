import inquirer from 'inquirer';
import config from '../../config';
import Context from '../../context';
import helpers from '../../helpers';
import DatabaseReceiver from '../../receivers/database-receiver';
import HttpWrapper, { CustomOkResponse } from '../../utils/http-wrapper';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Receiver: database', () => {

    const sandbox = createSandbox();

    const fakeDb = {
        databaseId: 1,
        userId: 1,
        username: 'fakeUsername',
        database: 'mongodb',
        name: 'fakeDbName',
        host: 'fakehost.mdbgo.com',
        description: 'fakeDesc',
        connectionString: 'mongodb://fakeUsername:password@mdbgo.dev:21017/fakeDbName'
    };

    let context: Context,
        receiver: DatabaseReceiver,
        getDatabasesStub: SinonStub;

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
            context = new Context('database', '', [], []);
            receiver = new DatabaseReceiver(context);
            sandbox.stub(receiver.http, 'get').resolves({ body: '[]' } as CustomOkResponse);

            await receiver.list();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if user has a database', async () => {

            const expectedResult = {
                type: 'table',
                value: [{
                    'Connection String': 'mongodb://fakeUsername:password@mdbgo.dev:21017/fakeDbName',
                    'Hostname': 'fakehost.mdbgo.com',
                    'Database': 'mongodb',
                    'Description': 'fakeDesc',
                    'Name': 'fakeDbName',
                    'Username': 'fakeUsername'
                }]
            };
            sandbox.stub(DatabaseReceiver.prototype, 'getDatabases').resolves([fakeDb]);
            context = new Context('database', 'list', [], []);
            receiver = new DatabaseReceiver(context);

            await receiver.list();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: init', () => {

        let createConfirmationPromptStub: SinonStub,
            createPromptModuleStub: SinonStub,
            promptStub: any,
            postStub: SinonStub;

        beforeEach(() => {

            createConfirmationPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt');
            promptStub = sandbox.stub().resolves({ username: 'fakeUser', password: 'fakePass', repeatPassword: 'fakePass', name: 'fakeName', description: 'fakeDesc' });
            createPromptModuleStub = sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
            sandbox.stub(config, 'databases').value(['mysql8', 'mongodb']);
            context = new Context('database', 'init', [], ['--database', 'mysql8']);
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
            context = new Context('database', 'delete', [], []);
            receiver = new DatabaseReceiver(context);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if database not found', async () => {

            const expectedResult = { type: 'text', value: 'Database fakeDb not found.' };
            getDatabasesStub.resolves([fakeDb]);
            context = new Context('database', 'delete', [], ['-n', 'fakeDb']);
            receiver = new DatabaseReceiver(context);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if user has a database', async () => {

            const expectedResult = { type: 'alert', value: { title: '\nResult:', body: 'Database successfully deleted.\n' }, color: 'green' };
            getDatabasesStub.resolves([fakeDb]);
            context = new Context('database', 'delete', [], []);
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
            context = new Context('database', 'delete', [], []);
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
            context = new Context('database', 'delete', [], []);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeDbName');
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakeDbName');
            receiver = new DatabaseReceiver(context);
            sandbox.stub(receiver.http, 'delete').rejects({ message: 'Fake error' });

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: deleteMany', () => {

        let createPassPromptStub: SinonStub,
            createConfirmationPromptStub: SinonStub,
            createCheckboxPromptStub: SinonStub,
            deleteStub: SinonStub;

        beforeEach(() => {

            getDatabasesStub = sandbox.stub(DatabaseReceiver.prototype, 'getDatabases');
            createConfirmationPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt');
            createCheckboxPromptStub = sandbox.stub(helpers, 'createCheckboxPrompt');
            createPassPromptStub = sandbox.stub(helpers, 'createPassPrompt');
            deleteStub = sandbox.stub(HttpWrapper.prototype, 'delete');
        });

        it('should delete database and return expected result', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Database fakeDbName successfully deleted.' }, color: 'green' };
            createPassPromptStub.resolves('fakePwd');
            getDatabasesStub.resolves([fakeDb]);
            deleteStub.resolves();
            context = new Context('database', 'delete', ['fakeDbName'], []);
            receiver = new DatabaseReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should delete all user databases and return expected result', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Databases db1, db2 successfully deleted.' }, color: 'green' };
            getDatabasesStub.resolves([{ name: 'db1', databaseId: 1 }, { name: 'db2', databaseId: 2 }]);
            createConfirmationPromptStub.resolves(true);
            createPassPromptStub.resolves('fakePwd');
            deleteStub.resolves();
            context = new Context('database', 'delete', [], ['--all']);
            receiver = new DatabaseReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should delete user databases with --many flag and return expected result', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Databases db1, db2 successfully deleted.' }, color: 'green' };
            getDatabasesStub.resolves([{ name: 'db1', databaseId: 1 }, { name: 'db2', databaseId: 2 }]);
            createCheckboxPromptStub.resolves([ 'db1', 'db2' ]);
            createPassPromptStub.resolves('fakePwd');
            deleteStub.resolves();
            context = new Context('database', 'delete', [], ['--many']);
            receiver = new DatabaseReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should delete all user databases with --force and --password flags and return expected result', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Databases db1, db2 successfully deleted.' }, color: 'green' };
            getDatabasesStub.resolves([{ name: 'db1', databaseId: 1 }, { name: 'db2', databaseId: 2 }]);
            deleteStub.resolves();
            context = new Context('database', 'delete', [], ['--all', '--force', '--password', 'fakePwd']);
            receiver = new DatabaseReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should return expected result if user does not have any databases', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any databases yet.' };
            getDatabasesStub.resolves([]);
            context = new Context('database', 'delete', [], []);
            receiver = new DatabaseReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should return expected result if database not found', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Database fakeDb not found.' }, color: 'red' };
            getDatabasesStub.resolves([fakeDb]);
            context = new Context('database', 'delete', ['fakeDb'], []);
            receiver = new DatabaseReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should return expected result if database name not provided', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Databases names not provided.' }, color: 'red' };
            getDatabasesStub.resolves([fakeDb]);
            context = new Context('database', 'delete', [], []);
            receiver = new DatabaseReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should return expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not delete: Fake error' }, color: 'red' };
            deleteStub.rejects({ message: 'Fake error' });
            createPassPromptStub.resolves('fakePwd');
            getDatabasesStub.resolves([fakeDb]);
            context = new Context('database', 'delete', ['fakeDbName'], []);
            receiver = new DatabaseReceiver(context);

            await receiver.deleteMany();

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
            context = new Context('database', 'info', [], []);
            receiver = new DatabaseReceiver(context);

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if database not found', async () => {

            const expectedResult = { type: 'text', value: 'Database fakeDb not found.' };
            getDatabasesStub.resolves([fakeDb]);
            context = new Context('database', 'info', [], ['-n', 'fakeDb']);
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
            context = new Context('database', 'info', [], []);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeDbName')
            receiver = new DatabaseReceiver(context);

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult[0]);
            expect(receiver.result.messages).to.deep.include(expectedResult[1]);
        });
    });
});
