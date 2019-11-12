'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: orders', () => {

    let authHandler;
    let command;
    let OrdersCommand;

    beforeEach(() => {

        OrdersCommand = require('../../commands/orders-command');
        authHandler = new AuthHandler(false);

        command = new OrdersCommand(authHandler);
        sandbox.stub(console, 'table');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler even though AuthHandler is undefined', () => {

        command = new OrdersCommand();

        expect(command).to.have.property('authHandler');
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

        const getStub = sandbox.stub(command.http, 'get').resolves('[]');

        command.execute();

        chai.assert.isTrue(getStub.called, 'HttpWrapper.getStub not called');
    });

    it('should execute call print', async () => {

        sandbox.stub(command.http, 'get').resolves('[]');
        const printSpy = sandbox.stub(command, 'print');

        await command.execute();

        chai.assert.isTrue(printSpy.calledOnce, 'OrderCommand.print not called');
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
        "postId":${orderId},
        "postDate":"${orderDate}",
        "postStatus":"${orderStatus}"}]`;
        sandbox.stub(command.http, 'get').resolves(receivedObject);

        command.result = [];

        await command.execute();

        expect(command.result).to.deep.equal(expectedResults);
    });

    it('should console.error on HttpWrapper.get rejected', async () => {

        sandbox.stub(command.http, 'get').rejects('Fake error');
        const errorStub = sandbox.stub(console, 'error');

        await command.execute();

        chai.assert.isTrue(errorStub.calledOnce, 'console.error not called on HttpWrapper.get failure');
    });

    it('should parse orders to json format', async () => {

        sandbox.stub(command.http, 'get').resolves('[{ "postId":123, "postDate":"2018-09-05", "postStatus":"wc-fakeStatus"}]');
        const parseStub = sandbox.spy(JSON, 'parse');

        await command.execute();

        chai.assert.isTrue(parseStub.calledOnce, 'JSON.parse not called');
    });

    it('should return expected result', async () => {

        command = new OrdersCommand(authHandler);
        const fakeOrders = [{ postId: 123, postDate: '2018-09-05', postStatus: 'wc-fakeStatus' }];
        sandbox.stub(command.http, 'get').resolves(fakeOrders);
        sandbox.stub(JSON, 'parse');
        const expectedResult = { 'Order ID': 123, 'Order Date': (new Date('9/5/2018, 2:00:00 AM')).toLocaleString(), 'Order Status': 'fakeStatus' };

        await command.execute();

        expect(command.result[0]).to.deep.equal(expectedResult);
    });
});
