import Context from '../../context';
import StarterReceiver from '../../receivers/starter-receiver';
import { CustomOkResponse } from '../../utils/http-wrapper';
import { createSandbox } from 'sinon';
import { expect } from 'chai';

describe('Receiver: starter', () => {

    const sandbox = createSandbox();

    let context: Context,
        receiver: StarterReceiver;

    beforeEach(() => {
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: list', function () {

        async function testPrintStartersInTableFormat(context: Context) {

            receiver = new StarterReceiver(context);

            sandbox.stub(receiver.http, 'get').resolves({
                body: JSON.stringify([
                    {
                        productId: null,
                        productTitle: 'Material Design for Bootstrap 4 (Vue)',
                        productSlug: 'Vue-Bootstrap-with-Material-Design',
                        available: true
                    },
                    {
                        productId: null,
                        productTitle: 'Material Design for Bootstrap 5',
                        productSlug: 'MDB5-Free',
                        available: true
                    },
                    {
                        productId: 55506,
                        productTitle: 'Material Design for Bootstrap Pro (Vue version)',
                        productSlug: 'vue-ui-kit',
                        available: false
                    }
                ])
            } as CustomOkResponse);

            const textLineStub = sandbox.stub(receiver.result, 'addTextLine');

            await receiver.list();

            expect(textLineStub).to.have.been.called;
        }

        it('should print starters in a table format when command is `mdb starter ls`', async function () {

            context = new Context('starter', 'ls', [], []);
            await testPrintStartersInTableFormat(context);
        });

        it('should print starters in a table format when command is `mdb starters`', async function () {

            context = new Context('starters', '', [], []);
            await testPrintStartersInTableFormat(context);
        });

        it('should print error if failed to fetch products', async function () {

            context = new Context('starter', 'ls', [], []);
            receiver = new StarterReceiver(context);

            sandbox.stub(receiver.http, 'get').rejects(new Error('fake error'));

            const alertStub = sandbox.stub(receiver.result, 'addAlert');

            await receiver.list();

            expect(alertStub).to.have.been.calledWith('red');
        });
    });
});
