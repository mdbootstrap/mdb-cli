'use strict';

const DbListCommand = require('../../commands/db-list-command');
const DbListHandler = require('../../utils/db-list-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: db-list', () => {

    let authHandler,
        command,
        fetchDatabasesStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new DbListCommand(authHandler);
        fetchDatabasesStub = sandbox.stub(command.handler, 'fetchDatabases');
        printStub = sandbox.stub(command, 'print');
        catchErrorStub = sandbox.stub(command, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(DbListHandler);
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new DbListCommand();

        expect(command).to.have.property('authHandler');
        expect(command.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should call handler methods in expected order', async () => {

        fetchDatabasesStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(fetchDatabasesStub, printStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should call handler methods in expected order if error', async () => {

        fetchDatabasesStub.rejects('fakeError');

        await command.execute();

        sandbox.assert.callOrder(fetchDatabasesStub, catchErrorStub);
        sandbox.assert.notCalled(printStub);
    });
});