'use strict';

const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const commandClass = require('../../commands/rename-command');
const sandbox = require('sinon').createSandbox();

describe('Command: rename', () => {

    let authHandler;
    let command;
    let askForNewProjectNameStub;
    let setNameStub;
    let removeProjectStub;
    let setProjectNameStub;
    let buildProjectStub;
    let publishStub;
    let consoleStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);

        command = new commandClass(authHandler);

        askForNewProjectNameStub = sandbox.stub(command.setNameHandler, 'askForNewProjectName');
        setNameStub = sandbox.stub(command.setNameHandler, 'setName');
        removeProjectStub = sandbox.stub(command.setNameHandler, 'removeProject');
        setProjectNameStub = sandbox.stub(command.publishHandler, 'setProjectName');
        buildProjectStub = sandbox.stub(command.publishHandler, 'buildProject');
        publishStub = sandbox.stub(command.publishHandler, 'publish');
        sandbox.stub(console, 'table');
        consoleStub = sandbox.stub(console, 'log');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have SetNameHandler handler', () => {

        const SetNameHandler = require('../../utils/set-name-handler');

        expect(command.setNameHandler).to.be.an.instanceOf(SetNameHandler);
    });

    it('should have PublishHandler handler', () => {

        const PublishHandler = require('../../utils/publish-handler');

        expect(command.publishHandler).to.be.an.instanceOf(PublishHandler);
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new commandClass();

        expect(command).to.have.property('authHandler');
    });

    describe('Should call functions', () => {

        beforeEach(() => {

            askForNewProjectNameStub.resolves();
            setNameStub.resolves();
            setProjectNameStub.resolves();
            buildProjectStub.resolves();
            publishStub.resolves();
        });

        it('should call setNameHandler.askForNewProjectName', async () => {

            expect(askForNewProjectNameStub.called).to.be.false;

            await command.execute();

            expect(askForNewProjectNameStub.calledOnce).to.be.true;
        });

        it('should call setNameHandler.setName after setNameHandler.askForNewProjectName', async () => {

            expect(setNameStub.called).to.be.false;

            await command.execute();

            expect(setNameStub.calledAfter(askForNewProjectNameStub)).to.be.true;
        });

        it('should call publishHandler.setProjectName after setNameHandler.setNameStub', async () => {

            expect(setProjectNameStub.called).to.be.false;

            await command.execute();

            expect(setProjectNameStub.calledAfter(setNameStub)).to.be.true;
        });

        it('should call publishHandler.buildProject after publishHandler.setProjectName', async () => {

            expect(buildProjectStub.called).to.be.false;

            await command.execute();

            expect(buildProjectStub.calledAfter(setNameStub)).to.be.true;
        });

        it('should call publishHandler.publish after publishHandler.buildProject', async () => {

            expect(publishStub.called).to.be.false;

            await command.execute();

            expect(publishStub.calledAfter(buildProjectStub)).to.be.true;
        });
    });

    describe('Should log on reject', () => {

        beforeEach(() => {

            // sandbox.spy(console, 'log');
        });

        afterEach(async () => {

            await command.execute();

            expect(consoleStub.called).to.be.true;
        });

        it('should call log on setNameHandler.askForNewProjectName', () => {

            askForNewProjectNameStub.rejects('fake error');
        });

        it('should call log on setNameHandler.setName', () => {

            askForNewProjectNameStub.resolves();
            setNameStub.rejects('fake error');
        });

        it('should call log on publishHandler.setProjectName', () => {

            askForNewProjectNameStub.resolves();
            setNameStub.resolves();
            setProjectNameStub.rejects('fake error');
        });

        it('should call log on publishHandler.buildProject', () => {

            askForNewProjectNameStub.resolves();
            setNameStub.resolves();
            setProjectNameStub.resolves();
            buildProjectStub.rejects('fake error');
        });

        it('should call log on publishHandler.publish', () => {

            askForNewProjectNameStub.resolves();
            setNameStub.resolves();
            setProjectNameStub.resolves();
            buildProjectStub.resolves();
            publishStub.rejects('fake error');
        });
    });

    it('should printHandlerResult print expected results', async () => {

        askForNewProjectNameStub.resolves();
        setNameStub.resolves();
        removeProjectStub.resolves();
        setProjectNameStub.resolves();
        buildProjectStub.resolves();
        publishStub.resolves();
        const setNameHandlerResult = ['Passed'];
        const publishHandlerResult = ['Ok!'];
        const expectedResult = [...setNameHandlerResult, ...publishHandlerResult];
        sandbox.stub(command.setNameHandler, 'getResult').returns(setNameHandlerResult);
        sandbox.stub(command.publishHandler, 'getResult').returns(publishHandlerResult);

        await command.execute();

        expect(console.table.calledOnceWith(expectedResult)).to.be.true;
    });

    it('should revert name change on reject if name changed', async () => {

        askForNewProjectNameStub.rejects('fake error');
        setNameStub.resolves();

        const oldName = 'old';
        const newName = 'new';
        const setNameHandlerResult = [{ 'Status': CliStatus.SUCCESS, 'Message': `from ${oldName} to ${newName}` }];
        const expectedResult = { 'Status': CliStatus.SUCCESS, 'Message': 'Project name has been successfully recovered' };
        sandbox.stub(command.setNameHandler, 'getResult').onCall(0).returns(setNameHandlerResult);

        await command.execute();

        expect(command.result[0]).to.be.deep.equal(expectedResult);
    });

    it('should print error if name not recovered', async () => {

        const oldName = 'old';
        const newName = 'new';
        const setNameHandlerResult = [{ 'Status': CliStatus.SUCCESS, 'Message': `from ${oldName} to ${newName}` }];
        command.setNameHandler.result = setNameHandlerResult;
        command.setNameHandler.oldName = oldName;
        command.setNameHandler.newName = newName;
        setNameStub.rejects('fake error');

        try {

            await command.revertNameChange();
        } catch (err) {

            expect(console.log.called).to.be.true;
        }
    });
});
