'use strict';

const commandClass = require('../../commands/set-domain-name-command');
const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();

describe('Command: set-domain-name', () => {

    let authHandler;
    let command;
    let consTabStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new commandClass(authHandler);
        consTabStub = sandbox.stub(console, 'table');
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

    it('should have SetDomainNameHandler handler', () => {

        const SetDomainNameHandler = require('../../utils/set-domain-name-handler');

        expect(command.handler).to.be.an.instanceOf(SetDomainNameHandler);
    });

    it('should call handler.askForDomainName', () => {

        const fakeReturnedPromise = {

            then() {

                return this;
            },
            catch() {

                return this;
            }

        };
        const handlerStub = sandbox.stub(command.handler, 'askForDomainName').returns(fakeReturnedPromise);

        command.execute();

        chai.assert.isTrue(handlerStub.called, 'handler.askForDomainName not called');
    });

    it('should console.log on handler.askForDomainName rejected string', async () => {

        sandbox.stub(command.handler, 'askForDomainName').rejects('Fake error');
        const consoleStub = sandbox.stub(console, 'log');

        await command.execute();

        chai.assert.isTrue(consoleStub.called, 'console.table not called on handler.askForDomainName failure');
    });

    it('should console.table on handler.askForDomainName rejected array', async () => {

        sandbox.stub(command.handler, 'askForDomainName').rejects([{ 'Status': CliStatus.ERROR, 'Message': 'fake error'}]);

        await command.execute();

        chai.assert.isTrue(consTabStub.called, 'console.table not called on handler.askForDomainName reject');
    });

    it('should call handler.setDomainName after handler.askForDomainName', async () => {

        const askForDomainNameStub = sandbox.stub(command.handler, 'askForDomainName').resolves(undefined);
        const setDomainNameStub = sandbox.stub(command.handler, 'setDomainName').resolves(undefined);

        await command.execute();

        chai.assert.isTrue(setDomainNameStub.calledAfter(askForDomainNameStub), 'handler.setDomainName not called');
    });

    it('should console.log on handler.setDomainName rejected string', async () => {

        sandbox.stub(command.handler, 'askForDomainName').resolves(undefined);
        sandbox.stub(command.handler, 'setDomainName').rejects('fake error');
        const consoleStub = sandbox.stub(console, 'log');

        await command.execute();

        chai.assert.isTrue(consoleStub.called, 'console.log not called on handler.setDomainName failure');
    });

    it('should console.table on handler.setDomainName rejected array', async () => {

        sandbox.stub(command.handler, 'askForDomainName').resolves(undefined);
        sandbox.stub(command.handler, 'setDomainName').rejects([{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': ''}]);

        await command.execute();

        chai.assert.isTrue(consTabStub.called, 'console.table not called on handler.askForDomainName reject');
    });

    it('should call print() after handler.setDomainName', async () => {

        sandbox.stub(command.handler, 'askForDomainName').resolves(undefined);
        sandbox.stub(command.handler, 'setDomainName').resolves(undefined);
        const printStub = sandbox.stub(command, 'print').returns();

        await command.execute();

        chai.assert.isTrue(printStub.called, 'print not called');
    });

    it('should call print() in print()', () => {

        const printStub = sandbox.stub(command, 'print').returns();

        command.print();

        chai.assert.isTrue(printStub.called, 'handler.print not called');
    });

    it('should call printHandlerResult() should print expected results', async () => {

        const expectedResult = [{ 'Status': CliStatus.SUCCESS, 'Message': 'OK!'}];
        sandbox.stub(command.handler, 'askForDomainName').resolves(undefined);
        sandbox.stub(command.handler, 'setDomainName').resolves(undefined);
        sandbox.stub(command.handler, 'getResult').returns(expectedResult);

        await command.execute();

        chai.assert.isTrue(consTabStub.calledWith(expectedResult), `printHandlerResult should print ${JSON.stringify(expectedResult)}`);
    });
});
