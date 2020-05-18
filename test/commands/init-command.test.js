'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: init', () => {

    let authHandler;
    let command;
    let InitCommand;
    const fakeReturnedPromise = {

        then(cb) {

            return cb();
        },
        catch() {

            return this;
        }
    };

    beforeEach(() => {

        InitCommand = require('../../commands/init-command');
        authHandler = new AuthHandler(false);

        command = new InitCommand(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new InitCommand();

        expect(command).to.have.property('authHandler');
    });

    it('should have SetNameHandler handler', () => {

        const InitHandler = require('../../utils/init-handler');

        expect(command.handler).to.be.an.instanceOf(InitHandler);
    });

    it('should call handler.setArgs', () => {

        const fakeReturnedPromise = {

            then() {

                return this;
            },
            catch() {

                return this;
            }
        };

        const handlerSpy = sandbox.spy(command.handler, 'setArgs');
        sandbox.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        sandbox.stub(command.handler, 'showUserPrompt').returns(fakeReturnedPromise);
        sandbox.stub(command.handler, 'initProject').returns(fakeReturnedPromise);

        command.execute();

        expect(handlerSpy.calledOnce).to.equal(true);
    });

    it('should call handler.getAvailableOptions', async () => {

        sandbox.stub(command.handler, 'setArgs');
        const getAvailableOptionsStub = sandbox.stub(command.handler, 'getAvailableOptions').resolves();
        sandbox.stub(command.handler, 'showUserPrompt').resolves();
        sandbox.stub(command.handler, 'initProject').resolves();
        sandbox.stub(console, 'table');

        await command.execute();

        expect(getAvailableOptionsStub.calledOnce).to.equal(true);
    });

    it('should call console.log on handler.getAvailableOptions reject', async () => {

        sandbox.stub(command.handler, 'setArgs');
        sandbox.stub(command.handler, 'getAvailableOptions').rejects('Fake error');
        const consoleStub = sandbox.stub(console, 'log');

        await command.execute();

        expect(consoleStub.calledOnce).to.equal(true);
    });

    it('should call handler.showUserPrompt', async () => {

        sandbox.stub(command.handler, 'setArgs');
        sandbox.stub(command.handler, 'getAvailableOptions').resolves();
        const showUserPromptStub = sandbox.stub(command.handler, 'showUserPrompt').resolves();
        sandbox.stub(command.handler, 'initProject').resolves();
        sandbox.stub(console, 'table');

        await command.execute();

        expect(showUserPromptStub.calledOnce).to.equal(true);
    });

    it('should call console.log on handler.showUserPrompt reject', async () => {

        sandbox.stub(command.handler, 'setArgs');
        sandbox.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        sandbox.stub(command.handler, 'showUserPrompt').rejects('Fake error');
        const consoleStub = sandbox.stub(console, 'log');

        await command.execute();

        expect(consoleStub.calledOnce).to.equal(true);
    });

    it('should call handler.initProject', async () => {

        sandbox.stub(command.handler, 'setArgs');
        sandbox.stub(command.handler, 'getAvailableOptions').resolves();
        sandbox.stub(command.handler, 'showUserPrompt').resolves();
        const initProjectStub = sandbox.stub(command.handler, 'initProject').resolves();
        sandbox.stub(console, 'table');

        await command.execute();

        expect(initProjectStub.calledOnce).to.equal(true);
    });

    it('should call console.log on handler.initProject reject', async () => {

        sandbox.stub(command.handler, 'setArgs');
        sandbox.stub(command.handler, 'getAvailableOptions').resolves();
        sandbox.stub(command.handler, 'showUserPrompt').resolves();
        sandbox.stub(command.handler, 'initProject').rejects('Fake error');
        const consoleStub = sandbox.stub(console, 'log');

        await command.execute();

        expect(consoleStub.calledOnce).to.equal(true);
    });
});
