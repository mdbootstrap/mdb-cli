'use strict';

const HttpWrapper = require('../../utils/http-wrapper');
const AuthHandler = require('../../utils/auth-handler');
const GetHandler = require('../../utils/get-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const inquirer = require('inquirer');

describe('Handler: Get', () => {

    let authHandler;
    let handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new GetHandler(authHandler);
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

        handler = new GetHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    describe('Method: setArgs', () => {

        const fakeArg = 'fakeArg';

        it('should set handler args', () => {

            handler.setArgs([fakeArg]);

            expect(handler.args).to.deep.include(fakeArg);
        });
    });

    describe('Method: getResult', () => {

        it('should return handler result', () => {

            const expectedResult = { Status: CliStatus.SUCCESS, Message: 'Success' };
            sandbox.stub(handler, 'result').value([expectedResult]);

            const result = handler.getResult();

            expect(result).to.deep.include(expectedResult);
        });
    });

    describe('Method: fetchProjects', async () => {

        it('should fetch user projects and assign to options', async () => {

            const fakeResult = [{ projectId: 1, userNicename: 'fakeUser', projectName: 'fakeName', domainName: null, publishDate: '2020-07-07T12:29:51.000Z', editDate: '2020-07-07T12:29:51.000Z', repoUrl: 'fakeUrl', status: 'published' }];
            sandbox.stub(HttpWrapper.prototype, 'get').resolves(fakeResult);
            const expectedResult = { name: 'fakeName', repoUrl: 'fakeUrl' };

            await handler.fetchProjects();

            expect(handler.options).to.deep.include(expectedResult);
        });

        it('should fetch user projects, parse and assign to options', async () => {

            const fakeResult = '[{"projectId":1,"userNicename":"fakeUser","projectName":"fakeName","domainName":null,"publishDate":"2020-07-07T12:29:51.000Z","editDate":"2020-07-07T12:29:51.000Z","repoUrl":"fakeUrl","status":"published"}]';
            sandbox.stub(HttpWrapper.prototype, 'get').resolves(fakeResult);
            const expectedResult = { name: 'fakeName', repoUrl: 'fakeUrl' };

            await handler.fetchProjects();

            expect(handler.options).to.deep.include(expectedResult);
        });
    });

    describe('Method: askForProjectName', () => {

        it('should reject if user does not have any projects', async () => {

            const expectedResult = { Status: CliStatus.NOT_FOUND, Message: 'You do not have any projects yet.' };
            sandbox.stub(handler, 'options').value([]);

            try {

                await handler.askForProjectName();
            } 
            catch (err) {

                expect(err).to.deep.include(expectedResult);
            }
        });

        it('should resolve if project name given in args', async () => {

            const fakeName = 'fakeProjectName';
            sandbox.stub(handler, 'args').value([fakeName]);
            sandbox.stub(handler, 'options').value([{ name: fakeName, repoUrl: 'fake.repo.url' }]);

            await handler.askForProjectName();

            expect(handler.name).to.be.equal(fakeName);
        });

        it('should create prompt and handle user selection', async () => {

            const fakeName = 'fakeProjectName';
            const promptStub = sandbox.stub().resolves({ name: fakeName });
            sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
            sandbox.stub(handler, 'options').value([{ name: fakeName, repoUrl: 'fake.repo.url' }]);

            await handler.askForProjectName();

            expect(handler.name).to.be.equal(fakeName);
        });
    });

    describe('Method: cloneRepository', () => {

        const fakeName = 'fakeProjectName';

        beforeEach(() => {

            sandbox.stub(handler, 'name').value(fakeName);
        });

        it('should resolve if repository for given project exists', async () => {

            const expectedResult = { Status: CliStatus.SUCCESS, Message: 'Success.' };
            sandbox.stub(handler, 'options').value([{ name: fakeName, repoUrl: 'fake.repo.url' }]);
            sandbox.stub(helpers, 'gitClone').resolves([expectedResult]);

            await handler.cloneRepository();

            expect(handler.result).to.deep.include(expectedResult);
        });

        it('should reject if problem with fetching repository', async () => {

            const expectedResult = { Status: CliStatus.ERROR, Message: 'There were some errors. Please try again.' };
            sandbox.stub(handler, 'options').value([{ name: fakeName, repoUrl: 'fake.repo.url' }]);
            sandbox.stub(helpers, 'gitClone').rejects([expectedResult]);

            try {

                await handler.cloneRepository();
            } 
            catch (err) {

                expect(err).to.deep.include(expectedResult);
            }
        });

        it('should reject if repository does not exist', async () => {

            const expectedResult = { Status: CliStatus.NOT_FOUND, Message: 'Repository for this project does not exist. Please add repository to be able to clone the project' };
            sandbox.stub(handler, 'options').value([{ name: fakeName, repoUrl: null }]);

            try {

                await handler.cloneRepository();
            } 
            catch (err) {

                expect(err).to.deep.include(expectedResult);
            }
        });

        it('should reject if project does not exist', async () => {

            const expectedResult = { Status: CliStatus.NOT_FOUND, Message: `Project ${fakeName} does not exist.` };
            sandbox.stub(handler, 'options').value([{ name: 'fakeName', repoUrl: null }]);

            try {

                await handler.cloneRepository();
            } 
            catch (err) {

                expect(err).to.deep.include(expectedResult);
            }
        });
    });
});