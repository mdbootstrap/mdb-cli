'use strict';

const DbCreateHandler = require('../../utils/db-create-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const config = require('../../config');
const inquirer = require('inquirer');

describe('Handler: DbCreate', () => {

    const username = 'fakeUsername',
        password = 'fakePassword',
        name = 'fakeDbName';

    let handler,
        authHandler,
        confirmationPromptStub,
        postStub,
        logStub;

    beforeEach(() => {

        sandbox.stub(config, 'databases').value(['mysql8', 'mongodb']);
        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');
        confirmationPromptStub = sandbox.stub(helpers, 'showConfirmationPrompt');
        postStub = sandbox.stub(HttpWrapper.prototype, 'post');
        logStub = sandbox.stub(console, 'log');
        authHandler = new AuthHandler(true);
        handler = new DbCreateHandler(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler if not specified in constructor', () => {

        handler = new DbCreateHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should getResult return handler result', () => {

        const expectedResult = { Status: 200, Message: 'Success' };
        sandbox.stub(handler, 'result').value([expectedResult]);

        const result = handler.getResult();

        expect(result).to.deep.include(expectedResult);
    });

    it('should setArgs show list if incorrect value provided in args', async () => {

        const database = 'mongodb';
        const promptStub = sandbox.stub().resolves({ name: database });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        await handler.setArgs(['--database=asdf']);

        expect(handler.database).to.be.equal(database);
    });

    it('should set database property', async () => {

        expect(handler.database).to.be.eq(undefined);

        await handler.setArgs(['--database', 'mongodb']);

        expect(handler.database).to.be.eq('mongodb');
    });

    it('should set database property if provided with equal sign', async () => {

        expect(handler.database).to.be.eq(undefined);

        await handler.setArgs(['--database=mysql8']);

        expect(handler.database).to.be.eq('mysql8');
    });

    it('should make a POST request to create mongo database', async () => {

        const connectionString = `mongodb://${username}:${password}@mdbgo.dev:21017/${name}`;
        const expectedResult = {
            'Username': username,
            'Password': password,
            'Database Name': name,
            'Connection String': connectionString
        };
        postStub.resolves({ username, password, name, connectionString, database: 'mongodb' });

        await handler.createDatabase();

        expect(handler.result).to.deep.include(expectedResult);
        sandbox.assert.calledTwice(logStub);
    });

    it('should get credentials and set in options', async () => {

        const expectedResult = JSON.stringify({ username, password, name, repeatPassword: password, description: '', database: 'mongodb' });
        const promptStub = sandbox.stub().resolves({ username, password, name, repeatPassword: password, description: '' });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        sandbox.stub(handler, 'database').value('mongodb');
        confirmationPromptStub.resolves(true);

        await handler.askCredentials();

        expect(handler.options.data).to.deep.eq(expectedResult);
    });

    it('should askCredentials() method reject if user does not want to create the database user', async () => {

        const expectedResult = { Status: 1, Message: 'OK, we will not create a database user.' };
        confirmationPromptStub.resolves(false);

        try {

            await handler.askCredentials();
        }
        catch (err) {

            expect(err).to.deep.include(expectedResult);
        }
    });

    it('should make a POST request to create mysql database', async () => {

        const connectionString = `mysql://${username}:${password}@mdbgo.dev:3306/${name}`;
        const expectedResult = {
            'Username': username,
            'Password': password,
            'Database Name': name,
            'Connection String': connectionString
        };
        postStub.resolves({ username, password, name, connectionString, database: 'mysql8' });

        await handler.createDatabase();

        expect(handler.result).to.deep.include(expectedResult);
        sandbox.assert.calledTwice(logStub);
    });
});
