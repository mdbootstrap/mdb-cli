'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sinon = require('sinon');

describe('Handler: set-name', () => {

    let authHandler;
    let handler;

    beforeEach(() => {

        const handlerClass = require('../../utils/set-name-handler');
        authHandler = new AuthHandler(false);

        handler = new handlerClass(authHandler);
    });

    it('should have `result` property', () => {

        expect(handler).to.have.property('result');
    });

    it('should `result` be an array', () => {

        expect(handler.result).to.be.a('array');
    });

    it('should have `name` property', () => {

        expect(handler).to.have.property('name');
    });

    it('should `name` be string', () => {

        expect(handler.name).to.be.a('string');
    });

    it('should have `authHandler` property', () => {

        expect(handler).to.have.property('authHandler');
    });

    it('should have assigned authHandler', () => {

        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should getResult() return result array', () => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'getResult() returns invalid result');
    });

    it('should createPromptModule() be invoked in askForNewProjectName() invoke', async () => {

        const inquirer = require('inquirer');
        const promptStub = sinon.stub().resolves({ name: 'stub' });
        const createPromptModuleStub = sinon.stub(inquirer, 'createPromptModule').returns(promptStub);

        expect(promptStub.called === false, 'promptStub.called shouldn\'t be called');
        await handler.askForNewProjectName();
        expect(promptStub.called === true, 'promptStub.called should be called');

        createPromptModuleStub.reset();
        createPromptModuleStub.restore();
    });

    it('should askForNewProjectName() return expected result', async () => {

        const inquirer = require('inquirer');
        const expectedResult = 'stub';

        const promptStub = sinon.stub().resolves({ name: expectedResult });
        const createPromptModuleStub = sinon.stub(inquirer, 'createPromptModule').returns(promptStub);

        expect(handler.name !== expectedResult, 'handler.name should have different name from expectedResult');
        await handler.askForNewProjectName();
        expect(handler.name === expectedResult, 'handler.name shold have the same name as expectedResult');

        createPromptModuleStub.reset();
        createPromptModuleStub.restore();
    });

    it('should setName() change project name', async () => {

        const inquirer = require('inquirer');
        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const name = 'name';
        const oldName = 'oldName';
        const expectedResults = { 'Status': 'name changed', 'Message': `Package name has been changed from ${oldName} to ${name} successful`};

        const promptStub = sinon.stub().resolves({ name: name });
        const createPromptModuleStub = sinon.stub(inquirer, 'createPromptModule').returns(promptStub);
        const serializerStub = sinon.stub(serializer, 'serializeJsonFile').resolves(undefined);
        const deserializerStub = sinon.stub(deserializer, 'deserializeJsonFile').resolves({ name: oldName });

        handler.name = name;
        expect(handler.result).to.be.an('array').that.is.empty;
        await handler.setName();
        expect(handler.result).to.deep.include(expectedResults);

        promptStub.reset();
        createPromptModuleStub.reset();
        createPromptModuleStub.restore();
        serializerStub.reset();
        serializerStub.restore();
        deserializerStub.reset();
        deserializerStub.restore();
    });

});
