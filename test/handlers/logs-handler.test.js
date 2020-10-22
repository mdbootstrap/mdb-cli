'use strict';

const HttpWrapper = require('../../utils/http-wrapper');
const LogsHandler = require('../../utils/logs-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();
const inquirer = require('inquirer');

describe('Handler: Logs', () => {

    const fakeName = 'fakeProjectName';
    const fakeResult = { logs: 'fake logs' };

    let authHandler, handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new LogsHandler(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assign authHandler', () => {

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should have assigned authHandler if not specified in constructor', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        handler = new LogsHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should set handler projectName and lines property using --lines flag', () => {

        expect(handler.projectName).to.be.equal('');
        expect(handler.lines).to.be.equal(undefined);

        handler.setArgs([fakeName, '--lines=100']);

        expect(handler.projectName).to.be.equal(fakeName);
        expect(handler.lines).to.be.equal('100');
    });

    it('should set handler lines property using --tail flag', () => {

        expect(handler.lines).to.be.equal(undefined);

        handler.setArgs(['--tail=100']);

        expect(handler.lines).to.be.equal('100');
    });

    it('should set handler projectName property', () => {

        expect(handler.projectName).to.be.equal('');

        handler.setArgs([fakeName]);

        expect(handler.projectName).to.be.equal(fakeName);
    });

    it('should getResult() return result array', () => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        expect(actualResult).to.deep.equal(expectedResult);
    });

    it('should fetch user projects and assign to projects', async () => {

        const fakeResult = [{ projectId: 1, userNicename: 'fakeUser', projectName: fakeName, domainName: null, publishDate: '2020-07-07T12:29:51.000Z', editDate: '2020-07-07T12:29:51.000Z', repoUrl: 'fakeUrl', status: 'backend' }];
        sandbox.stub(HttpWrapper.prototype, 'get').resolves(fakeResult);
        const expectedResult = { name: fakeName };

        await handler.fetchProjects();

        expect(handler.projects).to.deep.include(expectedResult);
    });

    it('should fetch user projects, parse and assign to projects', async () => {

        const fakeResult = '[{"projectId":1,"userNicename":"fakeUser","projectName":"fakeProjectName","domainName":null,"publishDate":"2020-07-07T12:29:51.000Z","editDate":"2020-07-07T12:29:51.000Z","repoUrl":"fakeUrl","status":"backend"}]';
        sandbox.stub(HttpWrapper.prototype, 'get').resolves(fakeResult);
        const expectedResult = { name: fakeName };

        await handler.fetchProjects();

        expect(handler.projects).to.deep.include(expectedResult);
    });

    it('should askForProjectName() set projectName property', async () => {

        sandbox.stub(handler, 'projects').value([{ name: fakeName }]);
        const promptStub = sandbox.stub().resolves({ name: fakeName });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        await handler.askForProjectName();

        expect(handler.projectName).to.be.equal(fakeName);
    });

    it('should askForProjectName() resolve if projectName was provided in args', async () => {

        sandbox.stub(handler, 'projects').value([{ name: fakeName }]);
        sandbox.stub(handler, 'projectName').value(fakeName);

        await handler.askForProjectName();

        expect(handler.projectName).to.be.equal(fakeName);
    });

    it('should askForProjectName() reject if user not have any projects', async () => {

        const expectedResult = { Status: 1, Message: 'You do not have any backend projects yet.' };

        try {

            await handler.askForProjectName();
        }
        catch (err) {

            expect(err).to.deep.include(expectedResult);
        }
    });

    it('should get backend project logs', async () => {

        sandbox.stub(handler, 'projectName').value(fakeName);
        sandbox.stub(HttpWrapper.prototype, 'get').resolves(JSON.stringify(fakeResult));

        await handler.getLogs();

        expect(handler.options.path).to.be.eq('/project/logs/fakeProjectName');
        expect(handler.result).to.be.deep.equal(fakeResult);
    });

    it('should get backend project logs with lines query', async () => {

        sandbox.stub(handler, 'lines').value(100);
        sandbox.stub(handler, 'projectName').value(fakeName);
        sandbox.stub(HttpWrapper.prototype, 'get').resolves(fakeResult);

        await handler.getLogs();

        expect(handler.options.path).to.be.eq('/project/logs/fakeProjectName?lines=100');
        expect(handler.result).to.be.deep.equal(fakeResult);
    });

    it('should print handler result', () => {

        sandbox.stub(handler, 'result').value(fakeResult);
        const logStub = sandbox.stub(console, 'log');

        handler.print();

        sandbox.assert.calledWith(logStub, fakeResult.logs);
    });
});