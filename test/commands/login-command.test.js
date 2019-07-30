'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sinon = require('sinon');

describe('Command: Login', () => {

    let authHandler;
    let command;

    beforeEach(() => {

        const commandClass = require('../../commands/login-command');
        authHandler = new AuthHandler(false);

        command = new commandClass(authHandler);
    });

    it('should have assigned handler', (done) => {

        expect(command).to.have.property('handler');

        done();
    });

    it('should have LoginHandler handler', (done) => {

        const LoginHandler = require('../../utils/login-handler');

        expect(command.handler).to.be.an.instanceOf(LoginHandler);

        done();
    });

    it('should call handler.askCredentials', (done) => {

        const fakeReturnedPromise = {

            then() {

                return this;
            },
            catch() {

                return this;
            }

        };
        const handlerStub = sinon.stub(command.handler, 'askCredentials').returns(fakeReturnedPromise);

        command.execute();

        chai.assert.isTrue(handlerStub.called, 'handler.askCredentials not called');

        handlerStub.reset();
        handlerStub.restore();

        done();
    });

    it('should console.error on handler.askCredentials failure', async () => {

        const handlerStub = sinon.stub(command.handler, 'askCredentials').rejects('Fake error');
        sinon.spy(console, 'error');

        await command.execute();

        chai.assert.isTrue(console.error.called, 'console.error not called on handler.askCredentials failure');

        handlerStub.reset();
        handlerStub.restore();
        console.error.restore();

        return Promise.resolve();
    });

    it('should call handler.login after handler.askCredentials', async () => {

        const askCredentialsStub = sinon.stub(command.handler, 'askCredentials').resolves(undefined);
        const loginStub = sinon.stub(command.handler, 'login').resolves(undefined);

        await command.execute();

        chai.assert.isTrue(loginStub.called, 'handler.login not called');

        askCredentialsStub.reset();
        loginStub.reset();
        askCredentialsStub.restore();
        loginStub.restore();

        return Promise.resolve();
    });

    it('should console.error on handler.login failure', async () => {

        const askCredentialsStub = sinon.stub(command.handler, 'askCredentials').resolves(undefined);
        const loginStub = sinon.stub(command.handler, 'login').rejects('Fake error');
        sinon.spy(console, 'error');

        await command.execute();

        chai.assert.isTrue(console.error.called, 'console.error not called on handler.login failure');

        askCredentialsStub.reset();
        loginStub.reset();
        askCredentialsStub.restore();
        loginStub.restore();
        console.error.restore();

        return Promise.resolve();
    });

    it('should call handler.parseResponse after handler.login', async () => {

        const askCredentialsStub = sinon.stub(command.handler, 'askCredentials').resolves(undefined);
        const loginStub = sinon.stub(command.handler, 'login').resolves(undefined);
        const parseResponseStub = sinon.stub(command.handler, 'parseResponse').returns();

        await command.execute();

        chai.assert.isTrue(parseResponseStub.called, 'handler.parseResponseStub not called');

        askCredentialsStub.reset();
        loginStub.reset();
        parseResponseStub.reset();
        askCredentialsStub.restore();
        loginStub.restore();
        parseResponseStub.restore();

        return Promise.resolve();
    });

    it('should call handler.saveToken after handler.login', async () => {

        const askCredentialsStub = sinon.stub(command.handler, 'askCredentials').resolves(undefined);
        const loginStub = sinon.stub(command.handler, 'login').resolves([{}]);
        const saveTokenStub = sinon.stub(command.handler, 'saveToken').returns();

        await command.execute();

        chai.assert.isTrue(saveTokenStub.called, 'handler.saveTokenStub not called');

        askCredentialsStub.reset();
        loginStub.reset();
        saveTokenStub.reset();
        askCredentialsStub.restore();
        loginStub.restore();
        saveTokenStub.restore();

        return Promise.resolve();
    });

    it('should call handler.getResult after handler.login', async () => {

        const askCredentialsStub = sinon.stub(command.handler, 'askCredentials').resolves(undefined);
        const loginStub = sinon.stub(command.handler, 'login').resolves([{}]);
        const getResultStub = sinon.stub(command.handler, 'getResult').returns();

        await command.execute();

        chai.assert.isTrue(getResultStub.called, 'handler.getResultStub not called');

        askCredentialsStub.reset();
        loginStub.reset();
        getResultStub.reset();
        askCredentialsStub.restore();
        loginStub.restore();
        getResultStub.restore();

        return Promise.resolve();
    });

    it('should call .print() after login', async () => {

        const askCredentialsStub = sinon.stub(command.handler, 'askCredentials').resolves(undefined);
        const loginStub = sinon.stub(command.handler, 'login').resolves([{}]);
        const commandPrintSpy = sinon.spy(command, 'print');

        await command.execute();

        chai.assert.isTrue(commandPrintSpy.called, 'command.print not called after handler.login');

        askCredentialsStub.reset();
        loginStub.reset();
        askCredentialsStub.restore();
        loginStub.restore();
        commandPrintSpy.restore();

        return Promise.resolve();
    });
});
