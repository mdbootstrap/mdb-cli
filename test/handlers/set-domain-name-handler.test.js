'use strict';

const SetDomainNameHandler = require('../../utils/set-domain-name-handler');
const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');

describe('Handler: set-domain-name', () => {

    const newDomainName = 'newDomainName';
    const oldDomainName = 'oldDomainName';
    const fakeError = new Error('fake error');
    const fileName = 'package.json';

    let authHandler,
        handler,
        showTextPromptStub,
        serializeJsonFileStub,
        deserializeJsonFileStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new SetDomainNameHandler(authHandler);
        showTextPromptStub = sandbox.stub(helpers, 'showTextPrompt');
        serializeJsonFileStub = sandbox.stub(helpers, 'serializeJsonFile');
        deserializeJsonFileStub = sandbox.stub(helpers, 'deserializeJsonFile');
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

    it('should have assigned authHandler if not specified in constructor', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        handler = new SetDomainNameHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should getResult() return result array', () => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'getResult() returns invalid result');
    });

    it('should askForDomainName() return expected result', async () => {

        showTextPromptStub.resolves(newDomainName);

        expect(handler.name !== newDomainName, 'handler.name should have different name from expectedResult');
        await handler.askForDomainName();
        expect(handler.name === newDomainName, 'handler.name should have the same name as expectedResult');
    });

    describe('Method: setDomainName', () => {

        it('should change project domain name', async () => {

            sandbox.stub(handler, 'name').value(newDomainName);
            const expectedResult = { Status: CliStatus.SUCCESS, Message: `Domain name has been changed to ${newDomainName} successfully` };
            deserializeJsonFileStub.resolves({ domainName: oldDomainName });
            serializeJsonFileStub.resolves();

            expect(handler.result).to.be.an('array').that.is.empty;

            await handler.setDomainName();

            expect(handler.result).to.deep.include(expectedResult);
        });

        it('should reject if old and new domain names are the same', async () => {

            sandbox.stub(handler, 'name').value(oldDomainName);
            const expectedResult = { Status: CliStatus.SUCCESS, Message: 'Domain names are the same.' };
            deserializeJsonFileStub.resolves({ domainName: oldDomainName });

            expect(handler.result).to.be.an('array').that.is.empty;

            try {

                await handler.setDomainName();
            }
            catch (err) {

                expect(err).to.deep.include(expectedResult);
            }
        });

        it('should return expected result if problem with file deserialization', async () => {

            const expectedResult = { Status: CliStatus.INTERNAL_SERVER_ERROR, Message: `Problem with reading ${fileName}` };
            deserializeJsonFileStub.rejects(fakeError);

            try {

                await handler.setDomainName();
            }
            catch (e) {

                expect(e).to.deep.include(expectedResult);
            }
        });

        it('should return expected result if problem with file serialization', async () => {

            const expectedResult = { 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with saving ${fileName}` };
            deserializeJsonFileStub.resolves({ domainName: oldDomainName });
            serializeJsonFileStub.rejects(fakeError);

            try {

                await handler.setDomainName();
            }
            catch (e) {

                expect(e).to.deep.include(expectedResult);
            }
        });
    });
});
