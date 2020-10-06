'use strict';

const HttpWrapper = require('../../utils/http-wrapper');
const InfoHandler = require('../../utils/info-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();
const inquirer = require('inquirer');

describe('Handler: Info', () => {

    const fakeMessage = 'Error';
    const fakeName = 'fakeProjectName';
    const fakeResult = { port: 123, logs: 'fake logs', startedAt: '2020-09-15 12:14:50', killedAt: '2020-09-15 12:15:56', defaultPort: 123 };

    let authHandler;
    let handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new InfoHandler(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assign authHandler', () => {

        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should have assigned authHandler if not specified in constructor', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        handler = new InfoHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should set handler args', () => {

        handler.setArgs([fakeName]);

        expect(handler.args).to.deep.include(fakeName);
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

    it('should askForProjectName() reject if user not have any projects', async () => {

        const expectedResult = {Status: 404, Message: 'You do not have any backend projects yet.'};

        try {

            await handler.askForProjectName();
        }
        catch(err) {

            expect(err).to.deep.include(expectedResult);
        }
    });

    it('should askForProjectName() set project name', async () => {

        sandbox.stub(handler, 'projects').value([{ name: fakeName }]);
        const promptStub = sandbox.stub().resolves({ name: fakeName });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        await handler.askForProjectName();

        expect(handler.projectName).to.be.equal(fakeName);
    });

    it('should askForProjectName() set project name if provided in args', async () => {

        sandbox.stub(handler, 'projects').value([{ name: fakeName }]);
        sandbox.stub(handler, 'args').value([fakeName]);

        await handler.askForProjectName();

        expect(handler.projectName).to.be.equal(fakeName);
    });

    it('should getInfo() make get request and return expected result', async () => {

        sandbox.stub(HttpWrapper.prototype, 'get').resolves(fakeResult);

        await handler.getInfo();

        expect(handler.result).to.deep.eq(fakeResult);
    });

    it('should getInfo() make get request, parse and return expected result', async () => {

        sandbox.stub(HttpWrapper.prototype, 'get').resolves(JSON.stringify(fakeResult));

        await handler.getInfo();

        expect(handler.result).to.deep.eq(fakeResult);
    });

    it('should getInfo() make get request and return expected result if error', async () => {

        sandbox.stub(HttpWrapper.prototype, 'get').rejects({ statusCode: 500, message: fakeMessage });

        try {

            await handler.getInfo();
        }
        catch (err) {

            expect(err).to.deep.eq({ statusCode: 500, message: fakeMessage });
        }
    });

    it('should print handler result if app is running', () => {

        handler.result = fakeResult;
        const logStub = sandbox.stub(console, 'log');

        handler.printResult();

        sandbox.assert.calledWith(logStub, '\x1b[36m%s\x1b[0m', 'Status:', 'running' );
        sandbox.assert.calledWith(logStub, '\x1b[36m%s\x1b[0m', 'Started at:', fakeResult.startedAt);
    });

    it('should print handler result if app is not running', () => {

        fakeResult.port = undefined;
        handler.result = fakeResult;
        const logStub = sandbox.stub(console, 'log');

        handler.printResult();

        sandbox.assert.calledWith(logStub, '\x1b[36m%s\x1b[0m', 'Status:', 'dead' );
        sandbox.assert.calledWith(logStub, '\x1b[36m%s\x1b[0m', 'Killed at:', fakeResult.killedAt);
    });
});
