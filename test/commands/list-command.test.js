'use strict';

const commandClass = require('../../commands/list-command');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: List', () => {

    let authHandler;
    let command;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new commandClass(authHandler);
        sandbox.stub(console, 'table');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        command = new commandClass();

        expect(command).to.have.property('authHandler');
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
    });

    it('should have ListHandler handler', () => {

        const ListHandler = require('../../utils/list-handler');

        expect(command.handler).to.be.an.instanceOf(ListHandler);
    });

    it('should call handler.fetchProducts', async () => {

        const handlerStub = sandbox.stub(command.handler, 'fetchProducts').resolves({});

        await command.execute();

        chai.assert.isTrue(handlerStub.called, 'handler.fetchProducts not called');
    });

    it('should call handler.getResult after handler.fetchProducts', async () => {

        sandbox.stub(command.handler, 'fetchProducts').resolves(undefined);
        const getResultStub = sandbox.stub(command.handler, 'getResult').returns();

        await command.execute();

        chai.assert.isTrue(getResultStub.called, 'handler.getResult not called');
    });

    it('should call print() after handler.fetchProducts', async () => {

        sandbox.stub(command.handler, 'fetchProducts').resolves(undefined);
        sandbox.stub(command.handler, 'getResult').returns();
        const printStub = sandbox.stub(command, 'print').returns();

        await command.execute();

        chai.assert.isTrue(printStub.called, 'handler.print not called');
    });

    it('should call catchError() after rejection', async () => {

        const fakeError = new Error('fake error');
        sandbox.stub(command.handler, 'fetchProducts').rejects(fakeError);
        const catchStub = sandbox.stub(command, 'catchError');

        await command.execute();

        chai.assert.isTrue(catchStub.called, 'catchError not called');
    });
});
