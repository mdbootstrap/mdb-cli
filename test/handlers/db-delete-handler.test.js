'use strict';

const DbDeleteHandler = require('../../utils/db-delete-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const config = require('../../config');
const inquirer = require('inquirer');

describe('Handler: DbDelete', () => {

    let handler,
        authHandler,
        getStub,
        deleteStub;

    beforeEach(() => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');
        sandbox.stub(config, 'host').value('fakehost');
        sandbox.stub(config, 'port').value(1234);
        getStub = sandbox.stub(HttpWrapper.prototype, 'get');
        deleteStub = sandbox.stub(HttpWrapper.prototype, 'delete');
        authHandler = new AuthHandler(true);
        handler = new DbDeleteHandler(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler if not specified in constructor', () => {

        handler = new DbDeleteHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should getResult return handler result', () => {

        const expectedResult = { Status: 200, Message: 'Success' };
        sandbox.stub(handler, 'result').value([expectedResult]);

        const result = handler.getResult();

        expect(result).to.deep.include(expectedResult);
    });

    it('should fetchDatabases() return expected result', async () => {

        const expectedResult = { databaseId: 1, name: 'fakeDbName' };

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

    it('should askForDbName() set the database property', async () => {

        const fakeDb = { name: 'fakeDbName', databaseId: 1 };
        sandbox.stub(handler, 'databases').value([fakeDb]);
        const promptStub = sandbox.stub().resolves(fakeDb);
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        await handler.askForDbName();

        expect(handler.database).to.be.equal(fakeDb);
    });

    it('should confirmSelection() resolve if names are the same', async () => {

        const fakeDbName = 'fakeDbName';
        sandbox.stub(handler, 'database').value({ name: fakeDbName });
        sandbox.stub(helpers, 'showTextPrompt').resolves(fakeDbName);

        const result = await handler.confirmSelection();

        expect(result).to.be.undefined;
    });

    it('should confirmSelection() reject if names are not the same', async () => {

        const fakeDbName = 'fakeDbName';
        sandbox.stub(handler, 'database').value({ name: fakeDbName });
        sandbox.stub(helpers, 'showTextPrompt').resolves(fakeDbName + 123);

        try {

            await handler.confirmSelection();
        }
        catch (err) {

            expect(err).to.be.deep.eq({ Status: 1, Message: 'The names do not match.' });
        }
    });

    it('should delete database', async () => {

        const fakeDbName = 'fakeDbName';
        sandbox.stub(handler, 'database').value({ name: fakeDbName, databaseId: 1 });
        const expectedResult = { Status: 200, Message: 'Database successfully deleted.' };
        deleteStub.resolves();

        await handler.deleteDatabase();

        expect(handler.result).to.deep.include(expectedResult);
        expect(handler.options.path).to.be.eq('/databases/1');
    });
});