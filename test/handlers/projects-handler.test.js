'use strict';

const ProjectsHandler = require('../../utils/projects-handler');
const AuthHandler = require('../../utils/auth-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const sandbox = require('sinon').createSandbox();

describe('Handler: Projects', () => {

    let authHandler,
        handler,
        getStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new ProjectsHandler(authHandler);
        getStub = sandbox.stub(HttpWrapper.prototype, 'get');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        handler = new ProjectsHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should fetch user projects and return expected result', async () => {

        const projects = [{
            projectId: 123,
            userNicename: 'fakeNicename',
            projectName: 'fakeProjectName',
            domainName: 'fakeDomainName',
            publishDate: '2019-06-24T06:49:53.000Z',
            editDate: '2019-06-24T06:49:53.000Z',
            repoUrl: 'https://gitlab.com/fakeUsername/fakeProjectName/',
            status: 'created'
        }];
        const formatedResult = [{
            'Project Name': 'fakeProjectName',
            'Project URL': 'https://mdbgo.io/fakeNicename/fakeProjectName/',
            'Domain': 'fakeDomainName',
            'Published': '-',
            'Edited': new Date(projects[0].editDate).toLocaleString(),
            'Repo': 'https://gitlab.com/fakeUsername/fakeProjectName/'
        }];
        getStub.resolves(projects);

        await handler.fetchProjects();

        expect(handler.result).to.be.an('Array');
        expect(handler.result).to.be.deep.equal(formatedResult);
    });

    it('should fetch user projects, parse to JSON and return expected result', async () => {

        const projects = `[{
            "projectId":123,
            "userNicename":"fakeNicename",
            "projectName":"fakeProjectName",
            "publishDate":"2019-06-24T06:49:53.000Z",
            "editDate":"2019-06-24T06:49:53.000Z",
            "status":"published"
        }]`;
        const projectsJson = JSON.parse(projects);
        const formatedResult = [{
            'Project Name': 'fakeProjectName',
            'Project URL': 'https://mdbgo.io/fakeNicename/fakeProjectName/',
            'Domain': '-',
            'Published': new Date(projectsJson[0].publishDate).toLocaleString(),
            'Edited': new Date(projectsJson[0].editDate).toLocaleString(),
            'Repo': '-'
        }];
        getStub.resolves(projects);
        const parseSpy = sandbox.spy(JSON, 'parse');

        await handler.fetchProjects();

        expect(handler.result).to.be.an('Array');
        expect(handler.result).to.be.deep.equal(formatedResult);
        expect(parseSpy.calledOnce).to.be.true;
    });

    it('should return expected result if user does not have any projects yet', async () => {

        const projects = [];
        const expectedResult = [{ Status: 0, Message: 'You do not have any projects yet.' }];
        getStub.resolves(projects);

        await handler.fetchProjects();

        expect(handler.result).to.be.an('Array');
        expect(handler.result).to.be.deep.equal(expectedResult);
    });

    it('should return expected result if user does not have any backend projects yet', async () => {

        const projects = [{
            projectId: 123,
            userNicename: 'fakeNicename',
            projectName: 'fakeProjectName',
            domainName: 'fakeDomainName',
            publishDate: '2019-06-24T06:49:53.000Z',
            editDate: '2019-06-24T06:49:53.000Z',
            repoUrl: 'https://gitlab.com/fakeUsername/fakeProjectName/',
            status: 'created'
        }];
        const expectedResult = [{ Status: 0, Message: 'You do not have any backend projects yet.' }];
        getStub.resolves(projects);
        sandbox.stub(handler, 'backend').value(true);

        await handler.fetchProjects();

        expect(handler.result).to.be.an('Array');
        expect(handler.result).to.be.deep.equal(expectedResult);
    });

    it('should fetch user backend projects and return expected result', async () => {

        const projects = [{
            projectId: 123,
            userNicename: 'fakeNicename',
            projectName: 'fakeProjectName',
            domainName: 'fakeDomainName',
            publishDate: '2019-06-24T06:49:53.000Z',
            editDate: '2019-06-24T06:49:53.000Z',
            repoUrl: null,
            status: 'backend',
            projectMeta: [{ metaKey: '_backend_technology', metaValue: 'node12' }]
        }];
        const formatedResult = [{
            'Project Name': 'fakeProjectName',
            'Published': new Date(projects[0].publishDate).toLocaleString(),
            'Edited': new Date(projects[0].editDate).toLocaleString(),
            'Technology': 'node12',
            'Repo': '-'
        }];
        getStub.resolves(projects);
        handler.backend = true;

        await handler.fetchProjects();

        expect(handler.result).to.be.an('Array');
        expect(handler.result).to.be.deep.equal(formatedResult);
    });

    it('should fetch user backend projects, parse to JSON and return expected result', async () => {

        const projects = `[{
            "projectId":123,
            "userNicename":"fakeNicename",
            "projectName":"fakeProjectName",
            "publishDate":"2019-06-24T06:49:53.000Z",
            "editDate":"2019-06-24T06:49:53.000Z",
            "repoUrl":"https://gitlab.com/fakeUsername/fakeProjectName/",
            "projectMeta":[],
            "status":"backend"
        }]`;
        const projectsJson = JSON.parse(projects);
        const formatedResult = [{
            'Project Name': 'fakeProjectName',
            'Published': new Date(projectsJson[0].publishDate).toLocaleString(),
            'Edited': new Date(projectsJson[0].editDate).toLocaleString(),
            'Technology': undefined,
            'Repo': 'https://gitlab.com/fakeUsername/fakeProjectName/'
        }];
        getStub.resolves(projects);
        const parseSpy = sandbox.spy(JSON, 'parse');
        sandbox.stub(handler, 'backend').value(true);

        await handler.fetchProjects();

        expect(handler.result).to.be.an('Array');
        expect(handler.result).to.be.deep.equal(formatedResult);
        expect(parseSpy.calledOnce).to.be.true;
    })
});
