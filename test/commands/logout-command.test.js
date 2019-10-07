'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();
const commandClass = require('../../commands/logout-command');

describe('Command: Logout', () => {

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

    it('should have assigned handler', (done) => {

        expect(command).to.have.property('handler');

        done();
    });

    it('should have LogoutHandler handler', (done) => {

        const LogoutHandler = require('../../utils/logout-handler');

        expect(command.handler).to.be.an.instanceOf(LogoutHandler);

        done();
    });

    it('should call handler.logout', (done) => {

        const fakeReturnedPromise = {

            then() {

                return this;
            },
            catch() {

                return this;
            }

        };
        const handlerStub = sandbox.stub(command.handler, 'logout').returns(fakeReturnedPromise);

        command.execute();

        chai.assert.isTrue(handlerStub.called, 'handler.logout not called');

        done();
    });

    it('should console.error on handler.logout failure', async () => {

        sandbox.stub(command.handler, 'logout').rejects('Fake error');
        sandbox.spy(console, 'error');

        await command.execute();

        chai.assert.isTrue(console.error.called, 'console.error not called on handler.logout failure');

        return Promise.resolve();
    });

    it('should call handler.getResult after logout', async () => {

        sandbox.stub(command.handler, 'logout').resolves(undefined);
        const handlerGetResultStub = sandbox.stub(command.handler, 'getResult').returns([]);

        await command.execute();

        chai.assert.isTrue(handlerGetResultStub.called, 'handler.getResult not called after handler.logout');

        return Promise.resolve();
    });

    it('should call .print() after logout', async () => {

        sandbox.stub(command.handler, 'logout').resolves(undefined);
        const commandPrintSpy = sandbox.spy(command, 'print');

        await command.execute();

        chai.assert.isTrue(commandPrintSpy.called, 'command.print not called after handler.logout');

        return Promise.resolve();
    });
});
