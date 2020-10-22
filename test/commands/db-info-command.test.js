'use strict';

const DbInfoCommand = require('../../commands/db-info-command');
const DbInfoHandler = require('../../utils/db-info-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: db-info', () => {

    let authHandler,
        command,
        setArgsStub,
        fetchDatabasesStub,
        askForDbNameStub,
        setResultStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new DbInfoCommand(authHandler);
        setArgsStub = sandbox.stub(command.handler, 'setArgs');
        fetchDatabasesStub = sandbox.stub(command.handler, 'fetchDatabases');
        askForDbNameStub = sandbox.stub(command.handler, 'askForDbName');
        setResultStub = sandbox.stub(command.handler, 'setResult');
        printStub = sandbox.stub(command, 'print');
        catchErrorStub = sandbox.stub(command, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(DbInfoHandler);
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new DbInfoCommand();

        expect(command).to.have.property('authHandler');
        expect(command.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should call handler methods in expected order', async () => {

        fetchDatabasesStub.resolves();
        askForDbNameStub.resolves();
        setResultStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchDatabasesStub, askForDbNameStub, setResultStub, printStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should call handler methods in expected order if error', async () => {

        fetchDatabasesStub.resolves();
        askForDbNameStub.resolves();
        setResultStub.rejects();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, fetchDatabasesStub, askForDbNameStub, setResultStub, catchErrorStub);
        sandbox.assert.notCalled(printStub);
    });
});