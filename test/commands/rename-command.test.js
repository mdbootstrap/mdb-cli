'use strict';

const RenameCommand = require('../../commands/rename-command');
const SetNameHandler = require('../../utils/set-name-handler');
const PublishHandler = require('../../utils/publish-handler');
const RenameHandler = require('../../utils/rename-handler');
const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();

describe('Command: rename', () => {

    let authHandler,
        command,
        setArgsStub,
        askForNewProjectNameStub,
        setNameStub,
        fetchProjectsStub,
        checkProjectStatusStub,
        getBackendTechnologyStub,
        removeProjectStub,
        setProjectNameStub,
        publishStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new RenameCommand(authHandler);
        setArgsStub = sandbox.stub(command.setNameHandler, 'setArgs');
        askForNewProjectNameStub = sandbox.stub(command.setNameHandler, 'askForNewProjectName');
        setNameStub = sandbox.stub(command.setNameHandler, 'setName');
        fetchProjectsStub = sandbox.stub(command.handler, 'fetchProjects');
        checkProjectStatusStub = sandbox.stub(command.handler, 'checkProjectStatus');
        getBackendTechnologyStub = sandbox.stub(command.handler, 'getBackendTechnology');
        removeProjectStub = sandbox.stub(command.setNameHandler, 'removeProject');
        setProjectNameStub = sandbox.stub(command.publishHandler, 'setProjectName');
        publishStub = sandbox.stub(command.publishHandler, 'publish');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new RenameCommand();

        expect(command).to.have.property('authHandler');
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(RenameHandler);
    });

    it('should have SetNameHandler handler', () => {

        expect(command).to.have.property('setNameHandler');
        expect(command.setNameHandler).to.be.an.instanceOf(SetNameHandler);
    });

    it('should have PublishHandler handler', () => {

        expect(command).to.have.property('publishHandler');
        expect(command.publishHandler).to.be.an.instanceOf(PublishHandler);
    });

    it('should call handler methods in expected order', async () => {

        const setHandlerArgsStub = sandbox.stub(command, 'setHandlerArgs').resolves();
        const setBackendTechnologyStub = sandbox.stub(command, 'setBackendTechnology').resolves();
        const printResultStub = sandbox.stub(command, 'printResult');
        const catchErrorStub = sandbox.stub(command, 'catchError');
        const revertNameChangeStub = sandbox.stub(command, 'revertNameChange');
        askForNewProjectNameStub.resolves();
        setNameStub.resolves();
        fetchProjectsStub.resolves();
        checkProjectStatusStub.resolves();
        getBackendTechnologyStub.resolves();
        removeProjectStub.resolves();
        setProjectNameStub.resolves();
        publishStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(
            setArgsStub,
            askForNewProjectNameStub,
            setNameStub,
            setHandlerArgsStub,
            fetchProjectsStub,
            checkProjectStatusStub,
            getBackendTechnologyStub,
            removeProjectStub,
            setProjectNameStub,
            setBackendTechnologyStub,
            publishStub,
            printResultStub
        );
        sandbox.assert.notCalled(catchErrorStub);
        sandbox.assert.notCalled(revertNameChangeStub);
    });

    it('should call handler methods in expected order if error', async () => {

        const setHandlerArgsStub = sandbox.stub(command, 'setHandlerArgs').resolves();
        const setBackendTechnologyStub = sandbox.stub(command, 'setBackendTechnology').resolves();
        const catchErrorStub = sandbox.stub(command, 'catchError');
        const revertNameChangeStub = sandbox.stub(command, 'revertNameChange');
        askForNewProjectNameStub.resolves();
        setNameStub.resolves();
        fetchProjectsStub.resolves();
        checkProjectStatusStub.resolves();
        getBackendTechnologyStub.resolves();
        removeProjectStub.resolves();
        setProjectNameStub.resolves();
        publishStub.rejects();

        await command.execute();

        sandbox.assert.callOrder(
            setArgsStub,
            askForNewProjectNameStub,
            setNameStub,
            setHandlerArgsStub,
            fetchProjectsStub,
            checkProjectStatusStub,
            getBackendTechnologyStub,
            removeProjectStub,
            setProjectNameStub,
            setBackendTechnologyStub,
            publishStub,
            catchErrorStub,
            revertNameChangeStub
        );
    });

    it('should revert name change on reject if name changed', async () => {

        setNameStub.resolves();
        const oldName = 'old';
        const newName = 'new';
        const setNameHandlerResult = [{ 'Status': CliStatus.SUCCESS, 'Message': `from ${oldName} to ${newName}` }];
        const expectedResult = { 'Status': CliStatus.SUCCESS, 'Message': 'Project name has been successfully recovered' };
        sandbox.stub(command.setNameHandler, 'getResult').returns(setNameHandlerResult);
        sandbox.stub(command, 'printResult');
        sandbox.stub(command, 'catchError');

        await command.revertNameChange();

        expect(command.result).to.deep.include(expectedResult);
    });

    it('should print result if name not changed', async () => {

        const printResultStub = sandbox.stub(command, 'printResult');
        const setNameHandlerResult = [{ 'Status': CliStatus.SUCCESS, 'Message': 'fake message' }];
        command.setNameHandler.result = setNameHandlerResult;
        sandbox.stub(console, 'log');

        await command.revertNameChange();

        sandbox.assert.calledOnce(printResultStub);
    });

    it('should print error if name not recovered', async () => {

        const oldName = 'old';
        const newName = 'new';
        const setNameHandlerResult = [{ 'Status': CliStatus.SUCCESS, 'Message': `from ${oldName} to ${newName}` }];
        command.setNameHandler.result = setNameHandlerResult;
        command.setNameHandler.oldName = oldName;
        command.setNameHandler.newName = newName;
        setNameStub.rejects('fake error');
        sandbox.stub(console, 'log');

        try {

            await command.revertNameChange();
        } 
        catch (err) {

            expect(console.log.called).to.be.true;
        }
    });

    it('should set rename handler arguments', async () => {

        const oldName = 'oldName', newName = 'newName';
        sandbox.stub(command.setNameHandler, 'oldName').value(oldName);
        sandbox.stub(command.setNameHandler, 'newName').value(newName);

        await command.setHandlerArgs();

        expect(command.handler.oldName).to.be.eq(oldName);
        expect(command.handler.newName).to.be.eq(newName);
    });

    it('should set backend technology if backend project', async () => {

        const fakeTechnology = 'fakeTechnology';
        sandbox.stub(command.handler, 'backend').value(true);
        sandbox.stub(command.handler, 'technology').value(fakeTechnology);

        await command.setBackendTechnology();

        expect(command.publishHandler.backendTechnology).to.be.eq(fakeTechnology);
    });

    it('should not set backend technology if not backend project', async () => {

        sandbox.stub(command.handler, 'backend').value(false);

        await command.setBackendTechnology();

        expect(command.publishHandler.backendTechnology).to.be.eq(undefined);
    });

    it('should set and print result', () => {

        const setNameHandlerResult = ['Passed'];
        const publishHandlerResult = ['Ok!'];
        const commandResult = ['Fake result'];
        const expectedResult = [...setNameHandlerResult, ...publishHandlerResult, ...commandResult];
        sandbox.stub(command.setNameHandler, 'getResult').returns(setNameHandlerResult);
        sandbox.stub(command.publishHandler, 'getResult').returns(publishHandlerResult);
        sandbox.stub(command, 'result').value(commandResult);
        const tableStub = sandbox.stub(console, 'table');

        command.printResult();

        sandbox.assert.calledWith(tableStub, expectedResult);
    });
});
