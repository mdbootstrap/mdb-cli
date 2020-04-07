'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: Login', () => {

    let authHandler;
    let command;
    let LoginCommand;

    beforeEach(() => {

        LoginCommand = require('../../commands/login-command');
        authHandler = new AuthHandler(false);

        command = new LoginCommand(authHandler);
        sandbox.stub(console, 'table');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', (done) => {

        expect(command).to.have.property('handler');

        done();
    });

    it('should have assigned authHandler even though AuthHandler is undefined', () => {

        command = new LoginCommand();

        expect(command).to.have.property('authHandler');
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
        const handlerStub = sandbox.stub(command.handler, 'askCredentials').returns(fakeReturnedPromise);

        command.execute();

        chai.assert.isTrue(handlerStub.called, 'handler.askCredentials not called');

        done();
    });

    it('should console.log on handler.askCredentials failure', async () => {

        sandbox.stub(command.handler, 'askCredentials').rejects('Fake error');
        const consoleStub = sandbox.stub(console, 'log');

        await command.execute();

        chai.assert.isTrue(consoleStub.called, 'console.error not called on handler.askCredentials failure');

        return Promise.resolve();
    });

    it('should call handler.login after handler.askCredentials', async () => {

        sandbox.stub(command.handler, 'askCredentials').resolves(undefined);
        const loginStub = sandbox.stub(command.handler, 'login').resolves(undefined);
        sandbox.stub(command.handler, 'parseResponse').returns();

        await command.execute();

        chai.assert.isTrue(loginStub.called, 'handler.login not called');

        return Promise.resolve();
    });

    it('should console.log on handler.login failure', async () => {

        sandbox.stub(command.handler, 'askCredentials').resolves(undefined);
        sandbox.stub(command.handler, 'login').rejects('Fake error');
        const consoleStub = sandbox.stub(console, 'log');

        await command.execute();

        chai.assert.isTrue(consoleStub.called, 'console.log not called on handler.login failure');

        return Promise.resolve();
    });

    it('should call handler.parseResponse after handler.login', async () => {

        sandbox.stub(command.handler, 'askCredentials').resolves(undefined);
        sandbox.stub(command.handler, 'login').resolves(undefined);
        const parseResponseStub = sandbox.stub(command.handler, 'parseResponse').returns();

        await command.execute();

        chai.assert.isTrue(parseResponseStub.called, 'handler.parseResponseStub not called');

        return Promise.resolve();
    });

    it('should call handler.saveToken after handler.login', async () => {

        sandbox.stub(command.handler, 'askCredentials').resolves(undefined);
        sandbox.stub(command.handler, 'login').resolves([{}]);
        const saveTokenStub = sandbox.stub(command.handler, 'saveToken').returns();

        await command.execute();

        chai.assert.isTrue(saveTokenStub.called, 'handler.saveTokenStub not called');

        return Promise.resolve();
    });

    it('should call handler.getResult after handler.login', async () => {

        sandbox.stub(command.handler, 'askCredentials').resolves(undefined);
        sandbox.stub(command.handler, 'login').resolves([{}]);
        const getResultStub = sandbox.stub(command.handler, 'getResult').returns();

        await command.execute();

        chai.assert.isTrue(getResultStub.called, 'handler.getResultStub not called');

        return Promise.resolve();
    });

    it('should call .print() after login', async () => {

        sandbox.stub(command.handler, 'askCredentials').resolves(undefined);
        sandbox.stub(command.handler, 'login').resolves([{}]);
        const commandPrintSpy = sandbox.spy(command, 'print');

        await command.execute();

        chai.assert.isTrue(commandPrintSpy.called, 'command.print not called after handler.login');

        return Promise.resolve();
    });
});
