'use strict';

const config = require('../../config');
const Context = require('../../context');
const OrderReceiver = require('../../receivers/order-receiver');
const sandbox = require('sinon').createSandbox();

describe('Receiver: order', () => {

    let context, receiver;

    beforeEach(() => {

        sandbox.stub(Context.prototype, 'authenticateUser');
        sandbox.stub(config, 'host').value('fakeHost');
        sandbox.stub(config, 'port').value('fakePort');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: list', () => {

        it('should set expected result if user does not have any orders', async () => {

            context = new Context('order', '', '', []);
            receiver = new OrderReceiver(context);
            sandbox.stub(receiver.http, 'get').resolves({ body: '[]' });

            await receiver.list();

            expect(receiver.result.messages[0].value).to.eql('You don\'t have any orders yet.');
        });

        it('should set expected result if user has an order', async () => {

            const fakeOrder = {
                postId: 1,
                postDate: '2019-06-24T06:49:53.000Z',
                postStatus: 'wc-completed'
            };
            const expectedResult = [{
                'Order ID': 1,
                'Order Date': new Date(fakeOrder.postDate).toLocaleString(),
                'Order Status': 'completed'
            }];
            context = new Context('order', '', '', []);
            receiver = new OrderReceiver(context);
            sandbox.stub(receiver.http, 'get').resolves({ body: JSON.stringify([fakeOrder]) });

            await receiver.list();

            expect(receiver.result.messages[0].value).to.eql(expectedResult);
        });
    });
});