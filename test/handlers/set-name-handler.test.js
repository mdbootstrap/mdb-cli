'use strict';

const SetNameHandler = require('../../utils/set-name-handler');
const AuthHandler = require('../../utils/auth-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const PackageManager = require('../../utils/managers/package-manager');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const config = require('../../config');

describe('Handler: set-name', () => {

    const newProjectName = 'newProjectName';
    const oldProjectName = 'oldProjectName';
    const fakeError = new Error('fake error');
    const fileName = 'package.json';

    let authHandler,
        handler,
        showTextPromptStub,
        serializeJsonFileStub,
        deserializeJsonFileStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new SetNameHandler(authHandler);
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

    it('should have `oldName` property', () => {

        expect(handler).to.have.property('oldName');
    });

    it('should `oldName` be string', () => {

        expect(handler.oldName).to.be.a('string');
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

        handler = new SetNameHandler();

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

    it('should askForNewProjectName() return expected result', async () => {

        showTextPromptStub.resolves(newProjectName);

        expect(handler.name !== newProjectName, 'handler.name should have different name from expectedResult');
        await handler.askForNewProjectName();
        expect(handler.name === newProjectName, 'handler.name should have the same name as expectedResult');
    });

    it('should askForNewProjectName() return expected result if name is set in args', async () => {

        handler.args = [newProjectName];

        expect(handler.name !== newProjectName, 'handler.name should have different name from expectedResult');
        await handler.askForNewProjectName();
        expect(handler.name === newProjectName, 'handler.name should have the same name as expectedResult');
    });

    describe('Method: setName', () => {

        it('should reject if names are the same', async () => {

            sandbox.stub(handler, 'handleMissingPackageJson').resolves(undefined);
            sandbox.stub(handler, 'newName').value(oldProjectName);
            deserializeJsonFileStub.resolves({ name: oldProjectName });
            const expectedResult = { 'Status': CliStatus.SUCCESS, 'Message': 'Project names are the same.' };

            expect(handler.result).to.be.an('array').that.is.empty;

            try {

                await handler.setName();
            }
            catch (err) {

                expect(err).to.deep.include(expectedResult);
            }
        });

        it('should change project name', async () => {

            sandbox.stub(handler, 'handleMissingPackageJson').resolves(undefined);
            sandbox.stub(handler, 'newName').value(newProjectName);
            const expectedResults = { Status: CliStatus.SUCCESS, Message: `Project name has been successfully changed from ${oldProjectName} to ${newProjectName}.` };
            deserializeJsonFileStub.resolves({ name: oldProjectName });
            serializeJsonFileStub.resolves();

            expect(handler.result).to.be.an('array').that.is.empty;

            try {

                await handler.setName();
            }
            catch (err) {

                expect(err).to.deep.include(expectedResults);
            }
        });

        it('should call handleMissingPackageJson if package.json does not exist', async () => {

            deserializeJsonFileStub.rejects(fakeError);
            const handleStub = sandbox.stub(handler, 'handleMissingPackageJson').resolves(undefined);

            try {

                await handler.setName();
            }
            catch (err) {

                expect(handleStub.called).to.be.true;
            }
        });

        it('should return expected result if problem with file serialization', async () => {

            const expectedResults = { Status: CliStatus.INTERNAL_SERVER_ERROR, Message: `Problem with saving ${fileName}` };
            deserializeJsonFileStub.resolves({ name: oldProjectName });
            serializeJsonFileStub.rejects(fakeError);

            try {

                await handler.setName();

            }
            catch (err) {

                expect(err).to.deep.include(expectedResults);
            }
        });
    });

    it('should removeProject() call HttpWrapper.delete() function', async () => {

        sandbox.stub(config, 'port').value('fakePort');
        sandbox.stub(config, 'host').value('fakeHost');
        const deleteStub = sandbox.stub(HttpWrapper.prototype, 'delete');

        await handler.removeProject();

        expect(deleteStub.calledOnce).to.be.true;
    });

    describe('Method: loadPackageManager', async () => {

        it('should call helpers.loadPackageManager', async () => {

            deserializeJsonFileStub.resolves({ packageManager: 'npm' });

            await handler.loadPackageManager();

            expect(handler.packageManager).to.be.instanceOf(PackageManager); // shallow comparison intentionally
        });
    });

    describe('Method: handleMissingPackageJson', () => {

        beforeEach(() => {

            sandbox.stub(handler, 'loadPackageManager').resolves();
        });

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should call helpers.createPackageJson', async () => {

            const successStatus = { 'Status': CliStatus.SUCCESS, 'Message': 'package.json created.' };
            const createStub = sandbox.stub(helpers, 'createPackageJson').resolves(successStatus);
            sandbox.stub(handler, 'setName').resolves();

            await handler.handleMissingPackageJson();

            expect(createStub.called).to.be.true;
        });

        it('should update result on successful package.json creation', async () => {

            const successStatus = { 'Status': CliStatus.SUCCESS, 'Message': 'package.json created.' };
            sandbox.stub(helpers, 'createPackageJson').resolves(successStatus);
            sandbox.stub(handler, 'setName').resolves();

            handler.result = [];

            await handler.handleMissingPackageJson();

            expect(handler.result.length).to.be.equal(1);
            expect(handler.result[0]).to.be.deep.equal(successStatus);
        });

        it('should call handler.setName on successful package.json creation', async () => {

            const successStatus = { 'Status': CliStatus.SUCCESS, 'Message': 'package.json created.' };
            sandbox.stub(helpers, 'createPackageJson').resolves(successStatus);
            const setNameStub = sandbox.stub(handler, 'setName').resolves();

            await handler.handleMissingPackageJson();

            expect(setNameStub.called).to.be.true;
        });

        it('should update result on error', async () => {

            const expectedResults = { 'Status': CliStatus.ERROR, 'Message': 'package.json not created.' };
            sandbox.stub(helpers, 'createPackageJson').rejects(fakeError);
            sandbox.stub(process, 'exit');

            handler.result = [];

            try {
                await handler.handleMissingPackageJson();
            } catch (e) {

                expect(handler.result.length).to.be.equal(2);
                expect(handler.result[1]).to.be.deep.equal(expectedResults);
            }
        });

        it('should call console.table', async () => {

            sandbox.stub(helpers, 'createPackageJson').rejects(fakeError);
            sandbox.stub(process, 'exit');
            const consoleStub = sandbox.stub(console, 'table');

            handler.result = [];

            try {
                await handler.handleMissingPackageJson();
            } catch (e) {

                expect(consoleStub.calledOnce).to.be.true;
            }
        });

        it('should call process.exit', async () => {

            sandbox.stub(helpers, 'createPackageJson').rejects(fakeError);
            sandbox.stub(console, 'table');
            const processStub = sandbox.stub(process, 'exit');

            handler.result = [];

            try {
                await handler.handleMissingPackageJson();
            } catch (e) {

                expect(processStub.calledOnce).to.be.true;
            }
        });
    });
});
