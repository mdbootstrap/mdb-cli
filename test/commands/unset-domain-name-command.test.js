'use strict';

const commandClass = require('../../commands/unset-domain-name-command');
const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();

describe('Command: unset-domain-name', () => {

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

    it('should have UnsetDomainNameHandler handler', () => {

        const UnsetDomainNameHandler = require('../../utils/unset-domain-name-handler');

        expect(command.handler).to.be.an.instanceOf(UnsetDomainNameHandler);
    });

    it('should call handler.unsetDomainName', async () => {

        const setDomainNameStub = sandbox.stub(command.handler, 'unsetDomainName').resolves(undefined);

        await command.execute();

        chai.assert.isTrue(setDomainNameStub.called, 'handler.unsetDomainName not called');
    });

    it('should console.log on handler.unsetDomainName rejected string', async () => {

        sandbox.stub(command.handler, 'unsetDomainName').rejects('fake error');
        const consoleStub = sandbox.stub(console, 'log');

        await command.execute();

        chai.assert.isTrue(consoleStub.called, 'console.log not called on handler.unsetDomainName failure');
    });

    it('should console.table on handler.unsetDomainName rejected array', async () => {

        sandbox.stub(command.handler, 'unsetDomainName').rejects([{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': ''}]);

        await command.execute();

        chai.assert.isTrue(consTabStub.called, 'console.table not called on handler.unsetDomainName reject');
    });

    it('should call print() after handler.unsetDomainName', async () => {

        const unsetDomainNameStub = sandbox.stub(command.handler, 'unsetDomainName').resolves(undefined);
        const printStub = sandbox.stub(command, 'print').returns();

        await command.execute();

        chai.assert.isTrue(printStub.calledAfter(unsetDomainNameStub), 'print not called');
    });

    it('should call print()', () => {

        const printStub = sandbox.stub(command, 'print').returns();

        command.print();

        chai.assert.isTrue(printStub.called, 'handler.print not called');
    });

    it('should call print() should print expected results', async () => {

        const expectedResult = [{ 'Status': CliStatus.SUCCESS, 'Message': 'OK!'}];
        sandbox.stub(command.handler, 'unsetDomainName').resolves(undefined);
        sandbox.stub(command.handler, 'getResult').returns(expectedResult);

        await command.execute();

        chai.assert.isTrue(consTabStub.calledWith(expectedResult), `print should print ${JSON.stringify(expectedResult)}`);
    });

});
