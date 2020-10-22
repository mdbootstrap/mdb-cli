'use strict';

const DbInfoHandler = require('../../utils/db-info-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();
const inquirer = require('inquirer');

describe('Handler: DbInfo', () => {

    const fakeUsername = 'fakeUsername',
        fakeDbName = 'fakeDbName',
        fakeDesc = 'Fake description',
        fakeConnectionString = 'mongodb://fakeUsername:password@mdbgo.dev:21017/fakeDbName';

    let handler,
        authHandler,
        getStub;

    beforeEach(() => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');
        getStub = sandbox.stub(HttpWrapper.prototype, 'get');
        authHandler = new AuthHandler(true);
        handler = new DbInfoHandler(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler if not specified in constructor', () => {

        handler = new DbInfoHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should getResult return handler result', () => {

        const expectedResult = { Status: 200, Message: 'Success' };
        sandbox.stub(handler, 'result').value([expectedResult]);

        const result = handler.getResult();

        expect(result).to.deep.include(expectedResult);
    });

    it('should set handler args', () => {

        handler.setArgs([fakeDbName]);

        expect(handler.args).to.deep.include(fakeDbName);
    });

    it('should fetchDatabases() return expected result', async () => {

        const expectedResult = {
            databaseId: 1,
            userId: 1,
            username: fakeUsername,
            database: 'mongodb',
            name: fakeDbName,
            description: fakeDesc,
            connectionString: fakeConnectionString
        };

        getStub.resolves([expectedResult]);

        await handler.fetchDatabases();

        expect(handler.databases).to.deep.include(expectedResult);
    });

    it('should fetchDatabases() reject if user does not have any databases', async () => {

        const expectedResult = { Status: 0, Message: 'You do not have any databases yet.' };
        getStub.resolves(JSON.stringify([]));

        try {

            await handler.fetchDatabases();
        }
        catch (err) {

            expect(err).to.deep.include(expectedResult);
        }
    });

    it('should set the dbName property if provided in args', async () => {

        sandbox.stub(handler, 'args').value([ fakeDbName]);

        await handler.askForDbName();

        expect(handler.dbName).to.be.equal(fakeDbName);
    });

    it('should set the dbName property', async () => {

        sandbox.stub(handler, 'databases').value([{ name: fakeDbName }]);
        const promptStub = sandbox.stub().resolves({ name: fakeDbName });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        await handler.askForDbName();

        expect(handler.dbName).to.be.equal(fakeDbName);
    });

    it('should set handler result', async () => {

        const expectedResult = { 'Connection String': fakeConnectionString };
        sandbox.stub(handler, 'databases').value([{ name: fakeDbName, connectionString: fakeConnectionString }]);
        sandbox.stub(handler, 'dbName').value(fakeDbName);

        await handler.setResult();

        expect(handler.result).to.deep.include(expectedResult);
    });

    it('should setResult() reject if database not found', async () => {

        const expectedResult = { Status: 404, Message: 'Database not found.' };
        sandbox.stub(handler, 'dbName').value(fakeDbName);

        try {

            await handler.setResult();
        }
        catch (err) {

            expect(err).to.deep.include(expectedResult);
        }
    });
});