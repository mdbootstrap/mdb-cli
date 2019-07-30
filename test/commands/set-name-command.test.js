'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sinon = require('sinon');

describe('Command: set-name', () => {

    let authHandler;
    let command;

    beforeEach(() => {

        const commandClass = require('../../commands/set-name-command');
        authHandler = new AuthHandler(false);

        command = new commandClass(authHandler);
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
        const handlerStub = sinon.stub(command.handler, 'askForNewProjectName').returns(fakeReturnedPromise);

        command.execute();

        chai.assert.isTrue(handlerStub.called, 'handler.askForNewProjectName not called');

        handlerStub.reset();
        handlerStub.restore();
    });

    it('should console.log on handler.askForNewProjectName rejected string', async () => {

        const handlerStub = sinon.stub(command.handler, 'askForNewProjectName').rejects('Fake error');
        sinon.spy(console, 'log');

        await command.execute();

        chai.assert.isTrue(console.log.called, 'console.error not called on handler.askForNewProjectName failure');

        handlerStub.reset();
        handlerStub.restore();
        console.log.restore();
    });

    it('should console.table on handler.askForNewProjectName rejected array', async () => {

        const handlerStub = sinon.stub(command.handler, 'askForNewProjectName').rejects([{ 'Status': 'fake error', 'Message': ''}]);
        sinon.spy(console, 'table');

        await command.execute();

        chai.assert.isTrue(console.table.called, 'console.table not called on handler.askForNewProjectName reject');

        handlerStub.reset();
        handlerStub.restore();
        console.table.restore();
    });

    it('should call handler.setName after handler.askForNewProjectName', async () => {

        const askCredentialsStub = sinon.stub(command.handler, 'askForNewProjectName').resolves(undefined);
        const setNameStub = sinon.stub(command.handler, 'setName').resolves(undefined);

        await command.execute();

        chai.assert.isTrue(setNameStub.called, 'handler.setName not called');

        askCredentialsStub.reset();
        setNameStub.reset();
        askCredentialsStub.restore();
        setNameStub.restore();
    });

    it('should console.log on handler.setName rejected string', async () => {

        const askForNewProjectNameStub = sinon.stub(command.handler, 'askForNewProjectName').resolves(undefined);
        const setNameStub = sinon.stub(command.handler, 'setName').rejects('fake error');
        sinon.spy(console, 'log');

        await command.execute();

        chai.assert.isTrue(console.log.called, 'console.error not called on handler.setName failure');

        askForNewProjectNameStub.reset();
        askForNewProjectNameStub.restore();
        setNameStub.reset();
        setNameStub.restore();
        console.log.restore();
    });

    it('should console.table on handler.setName rejected array', async () => {

        const askForNewProjectNameStub = sinon.stub(command.handler, 'askForNewProjectName').resolves(undefined);
        const setNameStub = sinon.stub(command.handler, 'setName').rejects([{ 'Status': 'fake error', 'Message': ''}]);
        sinon.spy(console, 'table');

        await command.execute();

        chai.assert.isTrue(console.table.called, 'console.table not called on handler.askForNewProjectName reject');

        askForNewProjectNameStub.reset();
        askForNewProjectNameStub.restore();
        setNameStub.reset();
        setNameStub.restore();
        console.table.restore();
    });

    it('should call printHandlerResult() after handler.setName', async () => {

        const askForNewProjectNameStub = sinon.stub(command.handler, 'askForNewProjectName').resolves(undefined);
        const setNameStub = sinon.stub(command.handler, 'setName').resolves(undefined);
        const printStub = sinon.stub(command, 'printHandlerResult').returns();

        await command.execute();

        chai.assert.isTrue(printStub.called, 'printHandlerResult not called');

        askForNewProjectNameStub.reset();
        askForNewProjectNameStub.restore();
        setNameStub.reset();
        setNameStub.restore();
        printStub.reset();
        printStub.restore();
    });

    it('should call print() in printHandlerResult()', () => {

        const printStub = sinon.stub(command, 'print').returns();

        command.printHandlerResult();

        chai.assert.isTrue(printStub.called, 'handler.print not called');

        printStub.reset();
        printStub.restore();
    });

    it('should call printHandlerResult() should print expected results', async () => {

        const expectedResult = [{ 'Status': 'passed', 'Message': 'OK!'}];
        const askForNewProjectNameStub = sinon.stub(command.handler, 'askForNewProjectName').resolves(undefined);
        const setNameStub = sinon.stub(command.handler, 'setName').resolves(undefined);
        const getResultStub = sinon.stub(command.handler, 'getResult').returns(expectedResult);
        const consoleSpy = sinon.spy(console, 'table');

        await command.execute();

        chai.assert.isTrue(consoleSpy.calledWith(expectedResult), `printHandlerResult should print ${JSON.stringify(expectedResult)}`);

        askForNewProjectNameStub.reset();
        askForNewProjectNameStub.restore();
        setNameStub.reset();
        setNameStub.restore();
        getResultStub.reset();
        getResultStub.restore();
        console.table.restore();
    });

});
