'use strict';

import Context from '../../context';
import Command from '../../commands/command';
import OrdersCommand from '../../commands/orders-command';
import OrderReceiver from '../../receivers/order-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: orders', () => {

    const sandbox = createSandbox();

    let command: Command,
        context: Context;

    beforeEach(() => {

        context = new Context('order', '', [], []);
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
        sandbox.assert.calledOnce(printResultStub);
    });
});
