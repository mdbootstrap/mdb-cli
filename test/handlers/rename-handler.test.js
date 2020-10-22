'use strict';

const RenameHandler = require('../../utils/rename-handler');
const AuthHandler = require('../../utils/auth-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const sandbox = require('sinon').createSandbox();
const config = require('../../config');
const inquirer = require('inquirer');
const { expect } = require('chai');

describe('Handler: rename', () => {

    let authHandler,
        handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new RenameHandler(authHandler);
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

        handler = new RenameHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should return handler result', () => {

        const fakeResult = { Status: 1, Message: 'Fake message' };
        sandbox.stub(handler, 'result').value(fakeResult);

        const result = handler.getResult();

        expect(result).to.deep.eq(fakeResult);
    });

    it('should fetch user projects', async () => {

        const projects = [{ projectName: 'test', status: 'created' }];
        sandbox.stub(HttpWrapper.prototype, 'get').resolves(projects);

        await handler.fetchProjects();

        expect(handler.projects).to.deep.eq(projects);
    });

    it('should fetch user projects and parse results', async () => {

        const projects = [{ projectName: 'test', status: 'created' }];
        sandbox.stub(HttpWrapper.prototype, 'get').resolves(JSON.stringify(projects));

        await handler.fetchProjects();

        expect(handler.projects).to.deep.eq(projects);
    });

    it('should check project status and set backend property', async () => {

        const oldName = 'oldName', newName = 'newName';
        sandbox.stub(handler, 'projects').value([{ projectName: oldName, status: 'backend', projectMeta: [] }]);
        sandbox.stub(handler, 'oldName').value(oldName);
        sandbox.stub(handler, 'newName').value(newName);

        await handler.checkProjectStatus();

        expect(handler.backend).to.be.true;
    });

    it('should check project status and set backend and technology property', async () => {

        const oldName = 'oldName', newName = 'newName', technology = 'fakeTech';
        sandbox.stub(handler, 'projects').value([{ projectName: oldName, status: 'backend', projectMeta: [{
            metaKey: '_backend_technology', metaValue: technology
        }] }]);
        sandbox.stub(handler, 'oldName').value(oldName);
        sandbox.stub(handler, 'newName').value(newName);

        await handler.checkProjectStatus();

        expect(handler.backend).to.be.true;
        expect(handler.technology).to.be.eq(technology);
    });

    it('should check project status and not set backend property', async () => {

        const oldName = 'oldName', newName = 'newName';
        sandbox.stub(handler, 'projects').value([{ projectName: oldName, status: 'created' }]);
        sandbox.stub(handler, 'oldName').value(oldName);
        sandbox.stub(handler, 'newName').value(newName);

        await handler.checkProjectStatus();

        expect(handler.backend).to.be.false;
    });

    it('should reject if project not published yet', async () => {

        const oldName = 'oldName';
        const expectedResult = { Status: 1, Message: `Project ${oldName} is not published yet.` };
        sandbox.stub(handler, 'projects').value([]);
        sandbox.stub(handler, 'oldName').value(oldName);

        try {

            await handler.checkProjectStatus();
        }
        catch (err) {

            expect(err).to.be.deep.eq(expectedResult);
        }
    });

    it('should reject if project with given name already exists', async () => {

        const oldName = 'oldName', newName = 'newName';
        const expectedResult = { Status: 1, Message: `Project ${newName} is already published. Please choose a different name` };
        sandbox.stub(handler, 'projects').value([{ projectName: oldName, status: 'backend' }, { projectName: newName, status: 'created' }]);
        sandbox.stub(handler, 'oldName').value(oldName);
        sandbox.stub(handler, 'newName').value(newName);

        try {

            await handler.checkProjectStatus();
        }
        catch (err) {

            expect(err).to.be.deep.eq(expectedResult);
        }
    });

    it('should get and set backend technology', async () => {

        const fakeTechnology = 'php';
        sandbox.stub(handler, 'backend').value(true);
        sandbox.stub(config, 'backendTechnologies').value(['node', fakeTechnology]);
        const promptStub = sandbox.stub().resolves({ name: fakeTechnology });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        await handler.getBackendTechnology();

        expect(handler.technology).to.be.eq(fakeTechnology);
    });

    it('should not set backend technology if project is not backend', async () => {

        sandbox.stub(handler, 'backend').value(false);

        await handler.getBackendTechnology();

        expect(handler.technology).to.be.eq(undefined);
    });
});