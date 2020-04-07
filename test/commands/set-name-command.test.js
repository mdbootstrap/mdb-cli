'use strict';

const commandClass = require('../../commands/set-name-command');
const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();

describe('Command: set-name', () => {

    let authHandler;
    let command;
    let consTabStub;
    let consLogStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new commandClass(authHandler);
        consTabStub = sandbox.stub(console, 'table');
        consLogStub = sandbox.stub(console, 'log');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        command = new commandClass();

        expect(command).to.have.property('handler');
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
    });

    it('should have SetNameHandler handler', () => {

        const SetNameHandler = require('../../utils/set-name-handler');

        expect(command.handler).to.be.an.instanceOf(SetNameHandler);
    });

    it('should call handler.askForNewProjectName', () => {

        const fakeReturnedPromise = {

            then() {

                return this;
            },
            catch() {

                return this;
            }

        };
        const handlerStub = sandbox.stub(command.handler, 'askForNewProjectName').returns(fakeReturnedPromise);

        command.execute();

        chai.assert.isTrue(handlerStub.called, 'handler.askForNewProjectName not called');
    });

    it('should console.log on handler.askForNewProjectName rejected string', async () => {

        sandbox.stub(command.handler, 'askForNewProjectName').rejects('Fake error');

        await command.execute();

        chai.assert.isTrue(consLogStub.called, 'console.error not called on handler.askForNewProjectName failure');
    });

    it('should console.table on handler.askForNewProjectName rejected array', async () => {

        sandbox.stub(command.handler, 'askForNewProjectName').rejects([{ 'Status': CliStatus.ERROR, 'Message': 'fake error'}]);

        await command.execute();

        chai.assert.isTrue(consTabStub.called, 'console.table not called on handler.askForNewProjectName reject');
    });

    it('should call handler.setName after handler.askForNewProjectName', async () => {

        sandbox.stub(command.handler, 'askForNewProjectName').resolves(undefined);
        const setNameStub = sandbox.stub(command.handler, 'setName').resolves(undefined);

        await command.execute();

        chai.assert.isTrue(setNameStub.called, 'handler.setName not called');
    });

    it('should console.log on handler.setName rejected string', async () => {

        sandbox.stub(command.handler, 'askForNewProjectName').resolves(undefined);
        sandbox.stub(command.handler, 'setName').rejects('fake error');

        await command.execute();

        chai.assert.isTrue(consLogStub.called, 'console.error not called on handler.setName failure');
    });

    it('should console.table on handler.setName rejected array', async () => {

        sandbox.stub(command.handler, 'askForNewProjectName').resolves(undefined);
        sandbox.stub(command.handler, 'setName').rejects([{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': ''}]);

        await command.execute();

        chai.assert.isTrue(consTabStub.called, 'console.table not called on handler.askForNewProjectName reject');
    });

    it('should call print() after handler.setName', async () => {

        sandbox.stub(command.handler, 'askForNewProjectName').resolves(undefined);
        sandbox.stub(command.handler, 'setName').resolves(undefined);
        const printStub = sandbox.stub(command, 'print').returns();

        await command.execute();

        chai.assert.isTrue(printStub.called, 'print not called');
    });

    it('should call print()', () => {

        const printStub = sandbox.stub(command, 'print').returns();

        command.print();

        chai.assert.isTrue(printStub.called, 'handler.print not called');
    });

    it('should call printHandlerResult() should print expected results', async () => {

        const expectedResult = [{ 'Status': CliStatus.SUCCESS, 'Message': 'OK!'}];
        sandbox.stub(command.handler, 'askForNewProjectName').resolves(undefined);
        sandbox.stub(command.handler, 'setName').resolves(undefined);
        sandbox.stub(command.handler, 'getResult').returns(expectedResult);

        await command.execute();

        chai.assert.isTrue(consTabStub.calledWith(expectedResult), `printHandlerResult should print ${JSON.stringify(expectedResult)}`);
    });
});
