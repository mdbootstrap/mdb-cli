import config from '../../config';
import Context from '../../context';
import OrderReceiver from '../../receivers/order-receiver';
import { CustomOkResponse } from '../../utils/http-wrapper';
import { createSandbox } from 'sinon';
import { expect } from 'chai';

describe('Receiver: order', () => {

    const sandbox = createSandbox();

    let context: Context,
        receiver: OrderReceiver;

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

            context = new Context('order', '', [], []);
            receiver = new OrderReceiver(context);
            sandbox.stub(receiver.http, 'get').resolves({ body: '[]' } as CustomOkResponse);

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
            context = new Context('order', '', [], []);
            receiver = new OrderReceiver(context);
            sandbox.stub(receiver.http, 'get').resolves({ body: JSON.stringify([fakeOrder]) } as CustomOkResponse);

            await receiver.list();

            expect(receiver.result.messages[0].value).to.eql(expectedResult);
        });
    });
});