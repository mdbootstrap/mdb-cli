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

    it('should call handler.getAvailableOptions', () => {

        const handlerStub = sandbox.stub(command.handler, 'setArgs');
        const getAvailableOptionsStub = sandbox.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        const showUserPromptStub = sandbox.stub(command.handler, 'showUserPrompt').returns(fakeReturnedPromise);
        const initProjectStub = sandbox.stub(command.handler, 'initProject').returns(fakeReturnedPromise);

        command.execute();

        expect(getAvailableOptionsStub.calledOnce).to.equal(true);

        getAvailableOptionsStub.reset();
        getAvailableOptionsStub.restore();
        showUserPromptStub.reset();
        showUserPromptStub.restore();
        initProjectStub.reset();
        initProjectStub.restore();
        handlerStub.reset();
        handlerStub.restore();
    });

    it('should call console.log on handler.getAvailableOptions reject', async () => {

        const handlerStub = sandbox.stub(command.handler, 'setArgs');
        const getAvailableOptionsStub = sandbox.stub(command.handler, 'getAvailableOptions').rejects('Fake error');
        const consoleSpy = sandbox.spy(console, 'log');

        await command.execute();

        expect(consoleSpy.calledOnce).to.equal(true);

        getAvailableOptionsStub.reset();
        getAvailableOptionsStub.restore();
        handlerStub.reset();
        handlerStub.restore();
        consoleSpy.restore();
    });

    it('should call handler.showUserPrompt', () => {

        const handlerStub = sandbox.stub(command.handler, 'setArgs');
        const getAvailableOptionsStub = sandbox.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        const showUserPromptStub = sandbox.stub(command.handler, 'showUserPrompt').returns(fakeReturnedPromise);
        const initProjectStub = sandbox.stub(command.handler, 'initProject').returns(fakeReturnedPromise);

        command.execute();

        expect(showUserPromptStub.calledOnce).to.equal(true);

        getAvailableOptionsStub.reset();
        getAvailableOptionsStub.restore();
        showUserPromptStub.reset();
        showUserPromptStub.restore();
        initProjectStub.reset();
        initProjectStub.restore();
        handlerStub.reset();
        handlerStub.restore();
    });

    it('should call console.log on handler.showUserPrompt reject', async () => {

        const handlerStub = sandbox.stub(command.handler, 'setArgs');
        const getAvailableOptionsStub = sandbox.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        const showUserPromptStub = sandbox.stub(command.handler, 'showUserPrompt').rejects('Fake error');
        const consoleSpy = sandbox.spy(console, 'log');

        await command.execute();

        expect(consoleSpy.calledOnce).to.equal(true);

        getAvailableOptionsStub.reset();
        getAvailableOptionsStub.restore();
        showUserPromptStub.reset();
        showUserPromptStub.restore();
        handlerStub.reset();
        handlerStub.restore();
        consoleSpy.restore();
    });

    it('should call handler.initProject', () => {

        const handlerStub = sandbox.stub(command.handler, 'setArgs');
        const getAvailableOptionsStub = sandbox.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        const showUserPromptStub = sandbox.stub(command.handler, 'showUserPrompt').returns(fakeReturnedPromise);
        const initProjectStub = sandbox.stub(command.handler, 'initProject').returns(fakeReturnedPromise);

        command.execute();

        expect(initProjectStub.calledOnce).to.equal(true);

        getAvailableOptionsStub.reset();
        getAvailableOptionsStub.restore();
        showUserPromptStub.reset();
        showUserPromptStub.restore();
        initProjectStub.reset();
        initProjectStub.restore();
        handlerStub.reset();
        handlerStub.restore();
    });

    it('should call console.log on handler.initProject reject', async () => {

        const handlerStub = sandbox.stub(command.handler, 'setArgs');
        const getAvailableOptionsStub = sandbox.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        const showUserPromptStub = sandbox.stub(command.handler, 'showUserPrompt').returns(fakeReturnedPromise);
        const initProjectStub = sandbox.stub(command.handler, 'initProject').rejects('Fake error');
        const consoleSpy = sandbox.spy(console, 'log');

        await command.execute();

        expect(consoleSpy.calledOnce).to.equal(true);

        getAvailableOptionsStub.reset();
        getAvailableOptionsStub.restore();
        showUserPromptStub.reset();
        showUserPromptStub.restore();
        initProjectStub.reset();
        initProjectStub.restore();
        handlerStub.reset();
        handlerStub.restore();
        consoleSpy.restore();
    });
});
