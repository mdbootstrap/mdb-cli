'use strict';

const Context = require('../../context');
const StarterReceiver = require('../../receivers/starter-receiver');
const sandbox = require('sinon').createSandbox();

describe('Receiver: starter', () => {

    let context, receiver;

    beforeEach(() => {
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: list', function () {

        async function testPrintStartersInTableFormat(context) {

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
            });

            const tableStub = sandbox.stub(receiver.result, 'addTable');

            await receiver.list();

            expect(tableStub).to.have.been.calledWith(sandbox.match.array);
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
