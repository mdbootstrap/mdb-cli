'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sinon = require('sinon');

describe('Command: orders', () => {

    let authHandler;
    let command;

    beforeEach(() => {

        const commandClass = require('../../commands/orders-command');
        authHandler = new AuthHandler(false);

        command = new commandClass(authHandler);
    });

    it('should have assigned options', () => {

        expect(command).to.have.property('options');
    });

    it('should have assigned options.path', () => {

        expect(command.options).to.have.property('path');
    });

    it('should have assigned options.method', () => {

        expect(command.options).to.have.property('method');
    });

    it('should have deleted options.data', () => {

        expect(command.options).to.not.have.property('data');
    });

    it('should options.path have orders read url', () => {

        expect(command.options.path).to.be.a('string', '/orders/read');
    });

    it('should options.method be GET', () => {

        expect(command.options.method).to.be.a('string', 'GET');
    });

    it('should execute call HttpWrapper.get', () => {

        const getStub = sinon.stub(command.http, 'get').resolves('[]');

        command.execute();

        chai.assert.isTrue(getStub.called, 'HttpWrapper.getStub not called');

        getStub.reset();
        getStub.restore();
    });

    it('should execute call print', async () => {

        const getStub = sinon.stub(command.http, 'get').resolves('[]');
        const printSpy = sinon.stub(command, 'print');

        await command.execute();

        chai.assert.isTrue(printSpy.calledOnce, 'OrderCommand.print not called');

        getStub.reset();
        getStub.restore();
        printSpy.reset();
        printSpy.restore();
    });

    it('should execute print expected results', async () => {

        const orderId = 1;
        const orderDate = 1;
        const orderStatus = 'wc-1';
        const expectedResults = [{
            'Order ID': orderId,
            'Order Date': new Date(orderDate.toString()).toLocaleString(),
            'Order Status': orderStatus.replace('wc-', '')
        }];
        const receivedObject = `[{
        "post_id":${orderId},
        "post_date":"${orderDate}",
        "post_status":"${orderStatus}"}]`;
        const getStub = sinon.stub(command.http, 'get').resolves(receivedObject);

        command.result = [];

        await command.execute();

        expect(command.result).to.deep.equal(expectedResults);

        getStub.reset();
        getStub.restore();
    });

    it('should console.error on HttpWrapper.get rejected', async () => {

        const getStub = sinon.stub(command.http, 'get').rejects('Fake error');
        sinon.spy(console, 'error');

        await command.execute();

        chai.assert.isTrue(console.error.calledOnce, 'console.error not called on HttpWrapper.get failure');

        getStub.reset();
        getStub.restore();
        console.error.restore();
    });

});
