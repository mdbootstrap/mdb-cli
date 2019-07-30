'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sinon = require('sinon');

describe('Command: Logout', () => {

    let authHandler;
    let command;

    beforeEach(() => {

        const commandClass = require('../../commands/logout-command');
        authHandler = new AuthHandler(false);

        command = new commandClass(authHandler);
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
        const handlerStub = sinon.stub(command.handler, 'logout').returns(fakeReturnedPromise);

        command.execute();

        chai.assert.isTrue(handlerStub.called, 'handler.logout not called');

        handlerStub.reset();
        handlerStub.restore();

        done();
    });

    it('should console.error on handler.logout failure', async () => {

        const handlerStub = sinon.stub(command.handler, 'logout').rejects('Fake error');
        sinon.spy(console, 'error');

        await command.execute();

        chai.assert.isTrue(console.error.called, 'console.error not called on handler.logout failure');

        handlerStub.reset();
        handlerStub.restore();
        console.error.restore();

        return Promise.resolve();
    });

    it('should call handler.getResult after logout', async () => {

        const handlerLogoutStub = sinon.stub(command.handler, 'logout').resolves(undefined);
        const handlerGetResultStub = sinon.stub(command.handler, 'getResult').returns([]);

        await command.execute();

        chai.assert.isTrue(handlerGetResultStub.called, 'handler.getResult not called after handler.logout');

        handlerLogoutStub.reset();
        handlerGetResultStub.reset();
        handlerLogoutStub.restore();
        handlerGetResultStub.restore();

        return Promise.resolve();
    });

    it('should call .print() after logout', async () => {

        const handlerLogoutStub = sinon.stub(command.handler, 'logout').resolves(undefined);
        const commandPrintSpy = sinon.spy(command, 'print');

        await command.execute();

        chai.assert.isTrue(commandPrintSpy.called, 'command.print not called after handler.logout');

        handlerLogoutStub.reset();
        handlerLogoutStub.restore();
        commandPrintSpy.restore();

        return Promise.resolve();
    });
});
