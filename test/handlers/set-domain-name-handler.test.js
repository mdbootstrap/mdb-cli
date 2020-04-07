'use strict';

const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();

describe('Handler: set-domain-name', () => {

    let authHandler;
    let handler;

    beforeEach(() => {

        const handlerClass = require('../../utils/set-domain-name-handler');
        authHandler = new AuthHandler(false);

        handler = new handlerClass(authHandler);
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

    it('should have assigned authHandler if not specified in constructor', (done) => {

        const handlerClass = require('../../utils/set-domain-name-handler');
        handler = new handlerClass();
        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);

        done();
    });

    it('should getResult() return result array', () => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'getResult() returns invalid result');
    });

    it('should createPromptModule() be invoked in askForDomainName() invoke', async () => {

        const inquirer = require('inquirer');
        const promptStub = sandbox.stub().resolves({ name: 'stub' });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        expect(promptStub.called === false, 'promptStub.called shouldn\'t be called');
        await handler.askForDomainName();
        expect(promptStub.called === true, 'promptStub.called should be called');
    });

    it('should askForDomainName() return expected result', async () => {

        const inquirer = require('inquirer');
        const expectedResult = 'stub';

        const promptStub = sandbox.stub().resolves({ name: expectedResult });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        expect(handler.name !== expectedResult, 'handler.name should have different name from expectedResult');
        await handler.askForDomainName();
        expect(handler.name === expectedResult, 'handler.name should have the same name as expectedResult');
    });

    it('should setDomainName() change project domain name', async () => {

        const inquirer = require('inquirer');
        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const name = 'domain-name';
        const expectedResults = { 'Status': CliStatus.SUCCESS, 'Message': `Domain name has been changed to ${name} successfully`};

        const promptStub = sandbox.stub().resolves({ name: name });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        sandbox.stub(serializer, 'serializeJsonFile').resolves(undefined);
        sandbox.stub(deserializer, 'deserializeJsonFile').resolves({ domainName: 'old-domain-name' });

        handler.name = name;
        expect(handler.result).to.be.an('array').that.is.empty;
        await handler.setDomainName();
        expect(handler.result).to.deep.include(expectedResults);
    });

    it('should reject if old and new domain names are the same', async () => {

        const inquirer = require('inquirer');
        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const name = 'domain-name';
        const expectedResults = { 'Status': CliStatus.SUCCESS, 'Message': 'Domain names are the same.'};

        const promptStub = sandbox.stub().resolves({ name: name });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        sandbox.stub(serializer, 'serializeJsonFile').resolves(undefined);
        sandbox.stub(deserializer, 'deserializeJsonFile').resolves({ domainName: name });

        handler.name = name;
        expect(handler.result).to.be.an('array').that.is.empty;
        try{

            await handler.setDomainName();
        
        } catch (err) {

            expect(err).to.deep.include(expectedResults);
        }
    });

    it('should return expected result if problem with file deserialization', async () => {

        const inquirer = require('inquirer');
        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const name = 'name';
        const fileName = 'package.json';
        const expectedResults = { 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with reading ${fileName}` };

        const promptStub = sandbox.stub().resolves({ name: name });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        const fakeError = new Error('fake error');
        sandbox.stub(serializer, 'serializeJsonFile').resolves(undefined);
        sandbox.stub(deserializer, 'deserializeJsonFile').rejects(fakeError);
        sandbox.stub(console, 'log');

        handler.name = name;

        try {

            await handler.setDomainName();
        } catch(e) {

            expect(e).to.deep.include(expectedResults);
        }
    });

    it('should return expected result if problem with file serialization', async () => {

        const fs = require('fs');
        const inquirer = require('inquirer');
        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const name = 'domain.com';
        const fileName = 'package.json';
        const expectedResults = {'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with saving ${fileName}`};
        const promptStub = sandbox.stub().resolves({ name: name });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        const fakeError = new Error('fake error');
        sandbox.stub(serializer, 'serializeJsonFile').rejects(fakeError);
        sandbox.stub(deserializer, 'deserializeJsonFile').resolves({ domainName: 'fake.domain.name' });
        sandbox.stub(fs, 'writeFile');
        sandbox.stub(console, 'log');

        try {

            handler.name = name;
            await handler.setDomainName();

        } catch (e) {

            expect(e).to.deep.include(expectedResults);
        }
    });

});
