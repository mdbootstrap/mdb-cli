'use strict';

const DbCreateCommand = require('../../commands/db-create-command');
const DbCreateHandler = require('../../utils/db-create-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: db-create', () => {

    let authHandler,
        command,
        setArgsStub,
        askCredentialsStub,
        createDatabaseStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new DbCreateCommand(authHandler);
        setArgsStub = sandbox.stub(command.handler, 'setArgs');
        askCredentialsStub = sandbox.stub(command.handler, 'askCredentials');
        createDatabaseStub = sandbox.stub(command.handler, 'createDatabase');
        printStub = sandbox.stub(command, 'print');
        catchErrorStub = sandbox.stub(command, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(DbCreateHandler);
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new DbCreateCommand();

        expect(command).to.have.property('authHandler');
        expect(command.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should call handler methods in expected order', async () => {

        setArgsStub.resolves();
        askCredentialsStub.resolves();
        createDatabaseStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, askCredentialsStub, createDatabaseStub, printStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should call handler methods in expected order if error', async () => {

        setArgsStub.resolves();
        askCredentialsStub.resolves();
        createDatabaseStub.rejects();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, askCredentialsStub, createDatabaseStub, catchErrorStub);
        sandbox.assert.notCalled(printStub);
    });
});