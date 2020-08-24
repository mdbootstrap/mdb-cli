'use strict';

const GetCommand = require('../../commands/get-command');
const AuthHandler = require('../../utils/auth-handler');
const GetHandler = require('../../utils/get-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: Get', () => {

    let authHandler,
        command,
        setArgsStub,
        fetchProjectsStub,
        askForProjectNameStub,
        cloneRepositoryStub,
        getResultStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new GetCommand(authHandler);
        setArgsStub = sandbox.stub(command.handler, 'setArgs');
        fetchProjectsStub = sandbox.stub(command.handler, 'fetchProjects');
        askForProjectNameStub = sandbox.stub(command.handler, 'askForProjectName');
        cloneRepositoryStub = sandbox.stub(command.handler, 'cloneRepository');
        getResultStub = sandbox.stub(command.handler, 'getResult');
        printStub = sandbox.stub(command, 'print');
        catchErrorStub = sandbox.stub(command, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command.handler).to.be.an.instanceOf(GetHandler);
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new GetCommand();

        expect(command).to.have.property('authHandler');
    });

    it('should call handler methods in expected order', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.resolves();
        cloneRepositoryStub.resolves();

        await command.execute();

        expect(setArgsStub.calledBefore(fetchProjectsStub)).to.be.true;
        expect(fetchProjectsStub.calledBefore(askForProjectNameStub)).to.be.true;
        expect(askForProjectNameStub.calledBefore(cloneRepositoryStub)).to.be.true;
        expect(cloneRepositoryStub.calledBefore(getResultStub)).to.be.true;
        expect(getResultStub.calledBefore(printStub)).to.be.true;
        expect(catchErrorStub.notCalled).to.be.true;
    });

    it('should catch error if fetchProjects() rejects', async () => {

        fetchProjectsStub.rejects('fakeError');

        await command.execute();

        expect(setArgsStub.calledBefore(fetchProjectsStub)).to.be.true;
        expect(fetchProjectsStub.called).to.be.true;
        expect(askForProjectNameStub.notCalled).to.be.true;
        expect(cloneRepositoryStub.notCalled).to.be.true;
        expect(getResultStub.notCalled).to.be.true;
        expect(catchErrorStub.calledAfter(fetchProjectsStub)).to.be.true;
    });

    it('should catch error if askForProjectName() rejects', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.rejects('fakeError');

        await command.execute();

        expect(setArgsStub.calledBefore(fetchProjectsStub)).to.be.true;
        expect(fetchProjectsStub.calledBefore(askForProjectNameStub)).to.be.true;
        expect(askForProjectNameStub.called).to.be.true;
        expect(cloneRepositoryStub.notCalled).to.be.true;
        expect(getResultStub.notCalled).to.be.true;
        expect(catchErrorStub.calledAfter(askForProjectNameStub)).to.be.true;
    });

    it('should catch error if cloneRepository() rejects', async () => {

        fetchProjectsStub.resolves();
        askForProjectNameStub.resolves();
        cloneRepositoryStub.rejects('fakeError');

        await command.execute();

        expect(setArgsStub.calledBefore(fetchProjectsStub)).to.be.true;
        expect(fetchProjectsStub.calledBefore(askForProjectNameStub)).to.be.true;
        expect(askForProjectNameStub.calledBefore(cloneRepositoryStub)).to.be.true;
        expect(cloneRepositoryStub.called).to.be.true;
        expect(getResultStub.notCalled).to.be.true;
        expect(catchErrorStub.calledAfter(cloneRepositoryStub)).to.be.true;
    });
});