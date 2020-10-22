'use strict';

const SetDomainNameHandler = require('../../utils/set-domain-name-handler');
const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const fs = require('fs');

describe('Handler: set-domain-name', () => {

    const newDomainName = 'newDomainName';
    const oldDomainName = 'oldDomainName';
    const fakeError = new Error('fake error');
    const fileName = 'package.json';

    let authHandler,
        handler,
        writeFileSyncStub,
        showTextPromptStub,
        serializeJsonFileStub,
        deserializeJsonFileStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new SetDomainNameHandler(authHandler);
        writeFileSyncStub = sandbox.stub(fs, 'writeFileSync');
        showTextPromptStub = sandbox.stub(helpers, 'showTextPrompt');
        serializeJsonFileStub = sandbox.stub(helpers, 'serializeJsonFile');
        deserializeJsonFileStub = sandbox.stub(helpers, 'deserializeJsonFile');
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

    it('should have `domainName` property', () => {

        expect(handler).to.have.property('domainName');
    });

    it('should `domainName` be string', () => {

        expect(handler.domainName).to.be.a('string');
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

    it('should askForDomainName() return expected result if name is set in args', async () => {

        handler.args = [newDomainName];

        expect(handler.name !== newDomainName, 'handler.name should have different name from expectedResult');
        await handler.askForDomainName();
        expect(handler.name === newDomainName, 'handler.name should have the same name as expectedResult');
    });

    describe('Method: setDomainName', () => {

        it('should change project domain name', async () => {

            sandbox.stub(handler, 'domainName').value(newDomainName);
            const expectedResult = { Status: CliStatus.SUCCESS, Message: 'Domain name has been saved in package.json file' };
            deserializeJsonFileStub.resolves({ domainName: oldDomainName });
            serializeJsonFileStub.resolves();

            expect(handler.result).to.be.an('array').that.is.empty;
            await handler.setDomainName();
            expect(handler.result).to.deep.include(expectedResult);
        });

        it('should reject if old and new domain names are the same', async () => {

            sandbox.stub(handler, 'domainName').value(oldDomainName);
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

            const expectedResult = { Status: CliStatus.CLI_ERROR, Message: 'Could not read `package.json` file.' };
            deserializeJsonFileStub.rejects();

            try {

                await handler.setDomainName();
            } catch (e) {

                expect(e).to.deep.include(expectedResult);
            }
        });

        it('should return expected result if problem with file serialization', async () => {

            const expectedResult = { 'Status': CliStatus.CLI_ERROR, 'Message': 'Could not save `' + fileName + '` file.' };
            deserializeJsonFileStub.resolves({ domainName: oldDomainName });
            serializeJsonFileStub.rejects(fakeError);

            try {

                await handler.setDomainName();
            }
            catch (e) {

                expect(e).to.deep.include(expectedResult);
            }
        });

        it('should handle missing `package.json` file', async () => {

            sandbox.stub(fs, 'existsSync').returns(false);
            deserializeJsonFileStub.rejects({ code: 'ENOENT' });
            const handleMissingPackageJsonStub = sandbox.stub(handler, 'handleMissingPackageJson');

            await handler.setDomainName();

            sandbox.assert.calledOnce(handleMissingPackageJsonStub);
        });

        it('should call saveInConfigFile() method if `index.php` file exists', async () => {

            sandbox.stub(fs, 'existsSync').returns(true);
            deserializeJsonFileStub.rejects({ code: 'ENOENT' });
            const saveInConfigFileStub = sandbox.stub(handler, 'saveInConfigFile');

            await handler.setDomainName();

            sandbox.assert.calledOnce(saveInConfigFileStub);
        });
    });

    describe('Method: handleMissingPackageJson', () => {

        let createPackageJsonStub,
            setDomainNameStub;

        beforeEach(() => {

            createPackageJsonStub = sandbox.stub(helpers, 'createPackageJson');
            setDomainNameStub = sandbox.stub(handler, 'setDomainName');
        });

        it('should create `package.json` file and set domain name', async () => {

            createPackageJsonStub.resolves();
            setDomainNameStub.resolves();

            await handler.handleMissingPackageJson();

            sandbox.assert.callOrder(createPackageJsonStub, setDomainNameStub);
        });
    });

    describe('Method: saveInConfigFile', () => {

        beforeEach(() => {

            sandbox.stub(handler, 'domainName').value(newDomainName);
        });

        it('should save domain name in `.mdb` file', async () => {

            const expectedResult = { Status: CliStatus.SUCCESS, Message: 'Domain name has been saved in .mdb file' };
            deserializeJsonFileStub.resolves({});
            serializeJsonFileStub.resolves();

            await handler.saveInConfigFile();

            expect(handler.result).to.deep.include(expectedResult);
        });

        it('should save domain name in `.mdb` file if file does not exist', async () => {

            const expectedResult = { Status: CliStatus.SUCCESS, Message: 'Domain name has been saved in .mdb file' };
            deserializeJsonFileStub.rejects({ code: 'ENOENT' });
            serializeJsonFileStub.rejects({ code: 'ENOENT' });
            writeFileSyncStub.resolves();

            await handler.saveInConfigFile();

            expect(handler.result).to.deep.include(expectedResult);
        });

        it('should reject with expected result if problem with file deserialization', async () => {

            const expectedResult = { Status: CliStatus.CLI_ERROR, Message: 'Could not read `.mdb` file.' };
            deserializeJsonFileStub.rejects();

            try {

                await handler.saveInConfigFile();
            } catch (e) {

                expect(e).to.deep.include(expectedResult);
            }
        });

        it('should reject with expected result if problem with file serialization', async () => {

            const expectedResult = { Status: CliStatus.CLI_ERROR, Message: 'Could not save `.mdb` file.' };
            deserializeJsonFileStub.resolves({});
            serializeJsonFileStub.rejects();

            try {

                await handler.saveInConfigFile();
            } catch (e) {

                expect(e).to.deep.include(expectedResult);
            }
        });
    });
});
