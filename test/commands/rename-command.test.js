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
    let printHandlerResultStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);

        command = new commandClass(authHandler);

        askForNewProjectNameStub = sandbox.stub(command.setNameHandler, 'askForNewProjectName');
        setNameStub = sandbox.stub(command.setNameHandler, 'setName');
        removeProjectStub = sandbox.stub(command.setNameHandler, 'removeProject');
        setProjectNameStub = sandbox.stub(command.publishHandler, 'setProjectName');
        buildProjectStub = sandbox.stub(command.publishHandler, 'buildProject');
        publishStub = sandbox.stub(command.publishHandler, 'publish');
        printHandlerResultStub = sandbox.stub(command, 'printHandlerResult');
        sandbox.stub(console, 'table');
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
            printHandlerResultStub.resolves();
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

        it('should call printHandlerResultStub after publishHandler.publish', async () => {

            expect(printHandlerResultStub.called).to.be.false;

            await command.execute();

            expect(printHandlerResultStub.calledAfter(publishStub)).to.be.true;
        });
    });

    describe('Should log on reject', () => {

        beforeEach(() => {

            sandbox.spy(console, 'log');
        });

        afterEach(async () => {

            await command.execute();

            expect(console.log.called).to.be.true;
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

    describe('Should print handler result on reject', () => {

        afterEach(async () => {

            expect(command.printHandlerResult.called).to.be.false;

            await command.execute();

            expect(command.printHandlerResult.called).to.be.true;
        });

        it('should call log on setNameHandler.askForNewProjectName', async () => {

            askForNewProjectNameStub.rejects(['fake error']);
        });

        it('should call log on setNameHandler.setName', () => {

            askForNewProjectNameStub.resolves();
            setNameStub.rejects(['fake error']);
        });

        it('should call log on publishHandler.setProjectName', () => {

            askForNewProjectNameStub.resolves();
            setNameStub.resolves();
            setProjectNameStub.rejects(['fake error']);
        });

        it('should call log on publishHandler.buildProject', () => {

            askForNewProjectNameStub.resolves();
            setNameStub.resolves();
            setProjectNameStub.resolves();
            buildProjectStub.rejects(['fake error']);
        });

        it('should call log on publishHandler.publish', () => {

            askForNewProjectNameStub.resolves();
            setNameStub.resolves();
            setProjectNameStub.resolves();
            buildProjectStub.resolves();
            publishStub.rejects(['fake error']);
        });
    });

    it('should printHandlerResult print expected results', async () => {

        askForNewProjectNameStub.resolves();
        setNameStub.resolves();
        removeProjectStub.resolves();
        setProjectNameStub.resolves();
        buildProjectStub.resolves();
        publishStub.resolves();
        printHandlerResultStub.restore();
        printHandlerResultStub.reset();
        const setNameHandlerResult = ['Passed'];
        const publishHandlerResult = ['Ok!'];
        const expectedResult = [...setNameHandlerResult, ...publishHandlerResult];
        sandbox.stub(command.setNameHandler, 'getResult').returns(setNameHandlerResult);
        sandbox.stub(command.publishHandler, 'getResult').returns(publishHandlerResult);

        await command.execute();

        expect(console.table.calledOnceWith(expectedResult)).to.be.true;
    });

    it('should not revert name change on reject  if name did not change', async () => {

        askForNewProjectNameStub.rejects('fake error');

        await command.execute();

        expect(printHandlerResultStub.getCall(0).args).to.be.empty;
    });

    it('should not revert name change on reject if status not equal name changed', async () => {

        askForNewProjectNameStub.rejects('fake error');
        setNameStub.resolves();

        const setNameHandlerResult = [{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': '' }];
        sandbox.stub(command.setNameHandler, 'getResult').returns(setNameHandlerResult);
        await command.execute();

        expect(printHandlerResultStub.getCall(0).args).to.be.empty;
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
