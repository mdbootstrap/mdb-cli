'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();
const chai = require('chai');
const { expect } = require('chai');

describe('Command: unpublish', () => {

    let authHandler;
    let command;
    let commandClass;

    beforeEach(() => {

        commandClass = require('../../commands/unpublish-command');
        authHandler = new AuthHandler(false);

        command = new commandClass(authHandler);
        sandbox.stub(console, 'table');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
    });

    it('should have assigned authHandler even though it is not specified', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new commandClass();

        expect(command).to.have.property('authHandler');
    });

    it('should have UnpublishHandler handler', () => {

        const UnpublishHandler = require('../../utils/unpublish-handler');

        expect(command.handler).to.be.an.instanceOf(UnpublishHandler);
    });

    it('should execute call handler.askForProjectName', () => {

        const fakeReturnedPromise = {

            then() {

                return this;
            },
            catch() {

                return this;
            }

        };
        const askForProjectNameStub = sandbox.stub(command.handler, 'askForProjectName').returns(fakeReturnedPromise);

        chai.assert.isTrue(!askForProjectNameStub.called, 'UnpublishHandler.askForProjectName called');

        command.execute();

        chai.assert.isTrue(askForProjectNameStub.calledOnce, 'UnpublishHandler.askForProjectName not called');
    });

    it('should execute call handler.unpublish after handler.askForProjectName', async () => {

        sandbox.stub(command.handler, 'askForProjectName').resolves();
        const unpublishStub = sandbox.stub(command.handler, 'unpublish').resolves();

        chai.assert.isTrue(!unpublishStub.called, 'UnpublishHandler.unpublish called');

        await command.execute();

        chai.assert.isTrue(unpublishStub.calledOnce, 'UnpublishHandler.unpublish not called');
    });

    it('should print results', async () => {

        sandbox.stub(command.handler, 'askForProjectName').resolves(undefined);
        sandbox.stub(command.handler, 'unpublish').resolves(undefined);
        const printSpy = sandbox.spy(command, 'print');

        await command.execute();

        chai.assert.isTrue(printSpy.calledOnce, 'print not called');
    });

    it('should call catchError() after rejection', async () => {

        const fakeError = new Error('fake error');
        sandbox.stub(command.handler, 'askForProjectName').rejects(fakeError);
        const catchStub = sandbox.stub(command, 'catchError');

        await command.execute();

        chai.assert.isTrue(catchStub.called, 'catchError not called');
    });
});
