'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const OrdersCommand = require('../../commands/orders-command');
const OrderReceiver = require('../../receivers/order-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: orders', () => {

    let command, context;

    beforeEach(() => {

        context = new Context('order', '', '', []);
        sandbox.stub(context, 'authenticateUser');
        command = new OrdersCommand(context);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver list method and print result', async () => {

        const listStub = sandbox.stub(OrderReceiver.prototype, 'list');
        const printResultStub = sandbox.stub(Command.prototype, 'printResult');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });
});
