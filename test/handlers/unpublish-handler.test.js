'use strict';

const UnpublishHandler = require('../../utils/unpublish-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const config = require('../../config');
const inquirer = require('inquirer');

describe('Handler: unpublish', () => {

    const fakeName = 'fakeProjectName';

    let authHandler, handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);

        handler = new UnpublishHandler(authHandler);

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

        handler = new UnpublishHandler();

        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should getResult() return result array', () => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'getResult() returns invalid result');
    });

    it('should set handler args', () => {

        const expectedResult = ['fakeArg'];

        expect(handler.args !== expectedResult, 'handler.args should have different args from expectedResult');
        handler.setArgs(expectedResult);
        expect(handler.args === expectedResult, 'handler.args shold have the same args as expectedResult');
    });

    it('should createPromptModule() be invoked in askForProjectName() invoke', async () => {

        sandbox.stub(handler, 'projects').value({ name: 'fakeProjectName' });
        const promptStub = sandbox.stub().resolves({ name: 'stub' });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        expect(promptStub.called === false, 'promptStub.called shouldn\'t be called');
        await handler.askForProjectName();
        expect(promptStub.called === true, 'promptStub.called should be called');
    });

    it('should fetch user projects and assign to projects', async () => {

        const fakeResult = [{ projectId: 1, userNicename: 'fakeUser', projectName: fakeName, domainName: null, publishDate: '2020-07-07T12:29:51.000Z', editDate: '2020-07-07T12:29:51.000Z', repoUrl: 'fakeUrl', status: 'backend' }];
        sandbox.stub(HttpWrapper.prototype, 'get').resolves(fakeResult);
        const expectedResult = { name: fakeName };

        await handler.fetchProjects();

        expect(handler.projects).to.deep.include(expectedResult);
    });

    it('should fetch user projects, parse and assign to projects', async () => {

        const fakeResult = '[{"projectId":1,"userNicename":"fakeUser","projectName":"fakeProjectName","domainName":null,"publishDate":"2020-07-07T12:29:51.000Z","editDate":"2020-07-07T12:29:51.000Z","repoUrl":"fakeUrl","status":"published"}]';
        sandbox.stub(HttpWrapper.prototype, 'get').resolves(fakeResult);
        const expectedResult = { name: fakeName };

        await handler.fetchProjects();

        expect(handler.projects).to.deep.include(expectedResult);
    });

    it('should askForProjectName() reject if user not have any projects', async () => {

        const expectedResult = { Status: 404, Message: 'You do not have any projects yet.' };

        try {

            await handler.askForProjectName();
        }
        catch (err) {

            expect(err).to.deep.include(expectedResult);
        }
    });

    it('should askForProjectName() resolve if project name is set in args', async () => {

        const expectedResult = 'stub';
        sandbox.stub(handler, 'projects').value({ name: 'fakeProjectName' });
        sandbox.stub(handler, 'args').value(expectedResult);

        expect(handler.name !== expectedResult, 'handler.name should have different name from expectedResult');
        await handler.askForProjectName();
        expect(handler.name === expectedResult, 'handler.name shold have the same name as expectedResult');
    });

    it('should askForProjectName() return expected result', async () => {

        sandbox.stub(handler, 'projects').value({ name: 'fakeProjectName' });
        const expectedResult = 'stub';

        const promptStub = sandbox.stub().resolves({ name: expectedResult });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        expect(handler.name !== expectedResult, 'handler.name should have different name from expectedResult');
        await handler.askForProjectName();
        expect(handler.name === expectedResult, 'handler.name shold have the same name as expectedResult');
    });

    it('should confirmSelection() resolve if names are the same', async () => {

        sandbox.stub(handler, 'projectName').value(fakeName);
        sandbox.stub(helpers, 'showTextPrompt').resolves(fakeName);

        try {

            await handler.confirmSelection();
        }
        catch (err) {

            expect(err).to.be.undefined;
        }
    });

    it('should confirmSelection() reject if names are not the same', async () => {

        sandbox.stub(handler, 'projectName').value(fakeName);
        sandbox.stub(helpers, 'showTextPrompt').resolves(fakeName + '123');

        try {

            await handler.confirmSelection();
        }
        catch (err) {

            expect(err).to.be.deep.eq({ Status: 1, Message: 'The names do not match.' });
        }
    });

    it('should unpublish() return a promise', () => {

        expect(handler.unpublish()).to.be.a('promise');
    });

    describe('Unpublish method', () => {

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
