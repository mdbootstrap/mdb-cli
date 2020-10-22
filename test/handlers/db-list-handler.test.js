'use strict';

const DbListHandler = require('../../utils/db-list-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Handler: DbList', () => {

    const fakeUsername = 'fakeUsername',
        fakeDbName = 'fakeDbName',
        fakeDesc = 'Fake description';

    let handler,
        authHandler,
        getStub;

    beforeEach(() => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');
        getStub = sandbox.stub(HttpWrapper.prototype, 'get');

        authHandler = new AuthHandler(true);
        handler = new DbListHandler(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler if not specified in constructor', () => {

        handler = new DbListHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should getResult return handler result', () => {

        const expectedResult = { Status: 200, Message: 'Success' };
        sandbox.stub(handler, 'result').value([expectedResult]);

        const result = handler.getResult();

        expect(result).to.deep.include(expectedResult);
    });

    it('should fetchDatabases return expected result if user does not have any databases', async () => {

        const expectedResult = { Status: 0, Message: 'You do not have any databases yet.' };
        getStub.resolves(JSON.stringify([]));

        await handler.fetchDatabases();

        expect(handler.result).to.deep.include(expectedResult);
    });

    it('should fetchDatabases return expected result', async () => {

        const expectedResult = {
            'Database': 'mongodb',
            'Name': fakeDbName,
            'Username': fakeUsername,
            'Connection String': 'mongodb://fakeUsername:password@mdbgo.dev:21017/fakeDbName',
            'Description': fakeDesc
        };

        getStub.resolves([{
            databaseId: 1,
            userId: 1,
            username: fakeUsername,
            database: 'mongodb',
            name: fakeDbName,
            description: fakeDesc,
            connectionString: 'mongodb://fakeUsername:password@mdbgo.dev:21017/fakeDbName'
        }]);

        await handler.fetchDatabases();

        expect(handler.result).to.deep.include(expectedResult);
    });
});