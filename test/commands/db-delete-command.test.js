'use strict';

const DbDeleteCommand = require('../../commands/db-delete-command');
const DbDeleteHandler = require('../../utils/db-delete-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: db-delete', () => {

    let authHandler,
        command,
        fetchDatabasesStub,
        askForDbNameStub,
        deleteDatabaseStub,
        confirmSelectionStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new DbDeleteCommand(authHandler);
        fetchDatabasesStub = sandbox.stub(command.handler, 'fetchDatabases');
        askForDbNameStub = sandbox.stub(command.handler, 'askForDbName');
        confirmSelectionStub = sandbox.stub(command.handler, 'confirmSelection');
        deleteDatabaseStub = sandbox.stub(command.handler, 'deleteDatabase');
        printStub = sandbox.stub(command, 'print');
        catchErrorStub = sandbox.stub(command, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(DbDeleteHandler);
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new DbDeleteCommand();

        expect(command).to.have.property('authHandler');
        expect(command.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should call handler methods in expected order', async () => {

        fetchDatabasesStub.resolves();
        askForDbNameStub.resolves();
        deleteDatabaseStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(fetchDatabasesStub, askForDbNameStub, confirmSelectionStub, deleteDatabaseStub, printStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should call handler methods in expected order if error', async () => {

        fetchDatabasesStub.resolves();
        askForDbNameStub.resolves();
        confirmSelectionStub.resolves();
        deleteDatabaseStub.rejects();

        await command.execute();

        sandbox.assert.callOrder(fetchDatabasesStub, askForDbNameStub, confirmSelectionStub, deleteDatabaseStub, catchErrorStub);
        sandbox.assert.notCalled(printStub);
    });
});