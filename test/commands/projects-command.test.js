'use strict';

const ProjectsHandler = require('../../utils/projects-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: projects', () => {

    let ProjectsCommand;
    let authHandler;
    let command;

    beforeEach(() => {

        ProjectsCommand = require('../../commands/projects-command');
        authHandler = new AuthHandler(false);

        command = new ProjectsCommand(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        command = new ProjectsCommand();

        expect(command).to.have.property('authHandler');
    });

    it('should have assigned options', () => {

        expect(command).to.have.property('options');
    });

    it('should execute call ProjectsHandler.fetchProjects', () => {

        const fetchStub = sandbox.stub(ProjectsHandler.prototype, 'fetchProjects').resolves([]);
        sandbox.stub(console, 'table');

        command.execute();

        chai.assert.isTrue(fetchStub.called, 'ProjectsHandler.fetchProjects not called');
    });

    it('should execute call print', async () => {

        sandbox.stub(ProjectsHandler.prototype, 'fetchProjects').resolves([]);
        const printStub = sandbox.stub(command, 'print');

        await command.execute();

        chai.assert.isTrue(printStub.calledOnce);
    });

    it('should console.log on ProjectsHandler.fetchProjects rejected', async () => {

        sandbox.stub(ProjectsHandler.prototype, 'fetchProjects').rejects('fakeError');
        const consoleStub = sandbox.stub(console, 'log');

        await command.execute();

        chai.assert.isTrue(consoleStub.calledOnce);
    });

});