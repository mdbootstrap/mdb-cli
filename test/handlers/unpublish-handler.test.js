'use strict';

const handlerClass = require('../../utils/unpublish-handler');
const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();

describe('Handler: unpublish', () => {

    let authHandler;
    let handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);

        handler = new handlerClass(authHandler);

        sandbox.stub(console, 'log');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have `result` property', () => {

        expect(handler).to.have.property('result');
    });

    it('should `result` be an array', () => {

        expect(handler.result).to.be.a('array');
    });

    it('should have `projectName` property', () => {

        expect(handler).to.have.property('projectName');
    });

    it('should `projectName` be string', () => {

        expect(handler.projectName).to.be.a('string');
    });

    it('should have `authHandler` property', () => {

        expect(handler).to.have.property('authHandler');
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        handler = new handlerClass();

        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should getResult() return result array', () => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'getResult() returns invalid result');
    });

    it('should createPromptModule() be invoked in askForProjectName() invoke', async () => {

        const inquirer = require('inquirer');
        const promptStub = sandbox.stub().resolves({ name: 'stub' });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        expect(promptStub.called === false, 'promptStub.called shouldn\'t be called');
        await handler.askForProjectName();
        expect(promptStub.called === true, 'promptStub.called should be called');
    });

    it('should askForProjectName() return expected result', async () => {

        const inquirer = require('inquirer');
        const expectedResult = 'stub';

        const promptStub = sandbox.stub().resolves({ name: expectedResult });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        expect(handler.name !== expectedResult, 'handler.name should have different name from expectedResult');
        await handler.askForProjectName();
        expect(handler.name === expectedResult, 'handler.name shold have the same name as expectedResult');
    });

    it('should unpublish() return a promise', () => {

        expect(handler.unpublish()).to.be.a('promise');
    });

    describe('Unpublish method', () => {

        const HttpWrapper = require('../../utils/http-wrapper');
        const config = require('../../config/');
        const fakePort = 0;
        const fakeHost = 'fakeHost';

        before(() => {

            sandbox.replace(config, 'port', fakePort);
            sandbox.replace(config, 'host', fakeHost);
        });

        after(() => {

            sandbox.restore();
        });

        it('should call HttpWrapper.delete', async () => {

            sandbox.stub(HttpWrapper.prototype, 'delete').resolves('fake response');

            await handler.unpublish();

            expect(handler.result).to.deep.equal([{ 'Status': CliStatus.HTTP_SUCCESS, 'Message': 'fake response' }]);
        });
    });
});
