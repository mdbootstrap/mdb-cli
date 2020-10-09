'use strict';

const HttpWrapper = require('../../utils/http-wrapper');
const KillHandler = require('../../utils/kill-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();
const inquirer = require('inquirer');

describe('Handler: Kill', () => {

    const fakeName = 'fakeName';

    let authHandler;
    let handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new KillHandler(authHandler);
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

        handler = new KillHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should set handler args', () => {

        handler.setArgs([fakeName, '-rm']);

        expect(handler.args).to.deep.include(fakeName);
        expect(handler.remove).to.be.equal(true);
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

        const fakeResult = '[{"projectId":1,"userNicename":"fakeUser","projectName":"fakeName","domainName":null,"publishDate":"2020-07-07T12:29:51.000Z","editDate":"2020-07-07T12:29:51.000Z","repoUrl":"fakeUrl","status":"backend"}]';
        sandbox.stub(HttpWrapper.prototype, 'get').resolves(fakeResult);
        const expectedResult = { name: fakeName };

        await handler.fetchProjects();

        expect(handler.projects).to.deep.include(expectedResult);
    });

    it('should askForProjectName() reject if user not have any backend projects', async () => {

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

    it('should kill() make delete request and return expected result', async () => {

        sandbox.stub(HttpWrapper.prototype, 'delete').resolves('Success!');

        await handler.kill();

        expect(handler.result).to.deep.include({ Status: 200, Message: 'Success!' });
    });

    it('should kill() change request path if -rm flag provided', async () => {

        sandbox.stub(HttpWrapper.prototype, 'delete').resolves('Success!');
        handler.remove = true;

        await handler.kill();

        expect(handler.options.path).to.include('/rmkill/');
    });

    it('should kill() change request path if -rm flag not provided', async () => {

        sandbox.stub(HttpWrapper.prototype, 'delete').resolves('Success!');
        handler.remove = false;

        await handler.kill();

        expect(handler.options.path).to.include('/kill/');
    });

    it('should kill() make delete request and return expected result if error', async () => {

        const fakeMessage = 'Error';
        sandbox.stub(HttpWrapper.prototype, 'delete').rejects({ statusCode: 500, message: fakeMessage });

        try {

            await handler.kill();
        }
        catch (err) {

            expect(err).to.deep.eq({ statusCode: 500, message: fakeMessage });
        }
    });
});
