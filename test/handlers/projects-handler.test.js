'use strict';

const AuthHandler = require('../../utils/auth-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const sandbox = require('sinon').createSandbox();

describe('Handler: Projects', () => {

    let projectsHandler;
    let ProjectsHandler;

    beforeEach(() => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        ProjectsHandler = require('../../utils/projects-handler');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        projectsHandler = new ProjectsHandler();

        expect(projectsHandler).to.have.property('authHandler');
        expect(projectsHandler.authHandler).to.be.an.instanceOf(AuthHandler);
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
            'Project URL': 'https://mdbgo.dev/fakeNicename/fakeProjectName/',
            'Project Domain': 'fakeDomainName',
            'Project Published': '-',
            'Project Edited': new Date(projects[0].editDate).toLocaleString(),
            'Project Repo': 'https://gitlab.com/fakeUsername/fakeProjectName/'
        }];
        sandbox.stub(HttpWrapper.prototype, 'get').resolves(projects);
        projectsHandler = new ProjectsHandler();

        await projectsHandler.fetchProjects();

        const result = projectsHandler.getResult();

        expect(result).to.be.an('Array');
        expect(result).to.be.deep.equal(formatedResult);
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
            'Project URL': 'https://mdbgo.dev/fakeNicename/fakeProjectName/',
            'Project Domain': '-',
            'Project Published': new Date(projectsJson[0].publishDate).toLocaleString(),
            'Project Edited': new Date(projectsJson[0].editDate).toLocaleString(),
            'Project Repo': '-'
        }];
        sandbox.stub(HttpWrapper.prototype, 'get').resolves(projects);
        const parseSpy = sandbox.spy(JSON, 'parse');
        projectsHandler = new ProjectsHandler();

        await projectsHandler.fetchProjects();

        const result = projectsHandler.getResult();

        expect(result).to.be.an('Array');
        expect(result).to.be.deep.equal(formatedResult);
        expect(parseSpy.calledOnce).to.be.true;
    });
});
