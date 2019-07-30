'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sinon = require('sinon');

describe('Command: init', () => {

    let authHandler;
    let command;
    const fakeReturnedPromise = {

        then(cb) {

            return cb();
        },
        catch() {

            return this;
        }

    };

    beforeEach(() => {

        const commandClass = require('../../commands/init-command');
        authHandler = new AuthHandler(false);

        command = new commandClass(authHandler);
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
    });

    it('should have SetNameHandler handler', () => {

        const InitHandler = require('../../utils/init-handler');

        expect(command.handler).to.be.an.instanceOf(InitHandler);
    });

    it('should call handler.parseArgs', () => {

        const fakeReturnedPromise = {

            then() {

                return this;
            },
            catch() {

                return this;
            }

        };

        const handlerSpy = sinon.spy(command.handler, 'parseArgs');
        const getAvailableOptionsStub = sinon.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        const showUserPromptStub = sinon.stub(command.handler, 'showUserPrompt').returns(fakeReturnedPromise);
        const initProjectStub = sinon.stub(command.handler, 'initProject').returns(fakeReturnedPromise);

        command.execute();

        expect(handlerSpy.calledOnce).to.equal(true);

        getAvailableOptionsStub.reset();
        getAvailableOptionsStub.restore();
        showUserPromptStub.reset();
        showUserPromptStub.restore();
        initProjectStub.reset();
        initProjectStub.restore();
        handlerSpy.restore();

    });

    it('should call handler.getAvailableOptions', () => {

        const handlerStub = sinon.stub(command.handler, 'parseArgs');
        const getAvailableOptionsStub = sinon.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        const showUserPromptStub = sinon.stub(command.handler, 'showUserPrompt').returns(fakeReturnedPromise);
        const initProjectStub = sinon.stub(command.handler, 'initProject').returns(fakeReturnedPromise);

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

        const handlerStub = sinon.stub(command.handler, 'parseArgs');
        const getAvailableOptionsStub = sinon.stub(command.handler, 'getAvailableOptions').rejects('Fake error');
        const consoleSpy = sinon.spy(console, 'log');

        await command.execute();

        expect(consoleSpy.calledOnce).to.equal(true);

        getAvailableOptionsStub.reset();
        getAvailableOptionsStub.restore();
        handlerStub.reset();
        handlerStub.restore();
        consoleSpy.restore();
    });

    it('should call handler.showUserPrompt', () => {

        const handlerStub = sinon.stub(command.handler, 'parseArgs');
        const getAvailableOptionsStub = sinon.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        const showUserPromptStub = sinon.stub(command.handler, 'showUserPrompt').returns(fakeReturnedPromise);
        const initProjectStub = sinon.stub(command.handler, 'initProject').returns(fakeReturnedPromise);

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

        const handlerStub = sinon.stub(command.handler, 'parseArgs');
        const getAvailableOptionsStub = sinon.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        const showUserPromptStub = sinon.stub(command.handler, 'showUserPrompt').rejects('Fake error');
        const consoleSpy = sinon.spy(console, 'log');

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

        const handlerStub = sinon.stub(command.handler, 'parseArgs');
        const getAvailableOptionsStub = sinon.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        const showUserPromptStub = sinon.stub(command.handler, 'showUserPrompt').returns(fakeReturnedPromise);
        const initProjectStub = sinon.stub(command.handler, 'initProject').returns(fakeReturnedPromise);

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

        const handlerStub = sinon.stub(command.handler, 'parseArgs');
        const getAvailableOptionsStub = sinon.stub(command.handler, 'getAvailableOptions').returns(fakeReturnedPromise);
        const showUserPromptStub = sinon.stub(command.handler, 'showUserPrompt').returns(fakeReturnedPromise);
        const initProjectStub = sinon.stub(command.handler, 'initProject').rejects('Fake error');
        const consoleSpy = sinon.spy(console, 'log');

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
