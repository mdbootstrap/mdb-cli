'use strict';

const SetNameHandler = require('../../utils/set-name-handler');
const AuthHandler = require('../../utils/auth-handler');
const HttpWrapper = require('../../utils/http-wrapper');
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

        it('should return expected result if problem with file deserialization', async () => {

            const expectedResults = { 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with reading ${fileName}` };
            deserializeJsonFileStub.rejects(fakeError);

            try {

                await handler.setName();
            }
            catch (err) {

                expect(err).to.deep.include(expectedResults);
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
});
