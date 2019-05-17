'use strict';

describe('Command: List', () => {

    it('should have assigned handler', (done) => {

        const command = require('../../commands/list-command');

        expect(command).to.have.property('handler');

        done();
    });

    it('should have ListHandler handler', (done) => {

        const command = require('../../commands/list-command');
        const ListHandler = require('../../utils/list-handler');

        expect(command.handler).to.be.an.instanceOf(ListHandler);

        done();
    });

    it('should call handler.fetchProducts', (done) => {

        const sinon = require('sinon');
        const command = require('../../commands/list-command');

        const fakeReturnedPromise = {

            then() {

                return this;
            },
            catch() {

                return this;
            }

        };
        const handlerStub = sinon.stub(command.handler, 'fetchProducts').returns(fakeReturnedPromise);

        command.execute();

        chai.assert.isTrue(handlerStub.called, 'handler.fetchProducts not called');

        handlerStub.reset();
        handlerStub.restore();

        done();
    });

    it('should call handler.getResult after handler.fetchProducts', async () => {

        const sinon = require('sinon');
        const command = require('../../commands/list-command');

        const fetchProductsStub = sinon.stub(command.handler, 'fetchProducts').resolves(undefined);
        const getResultStub = sinon.stub(command.handler, 'getResult').returns();

        await command.execute();

        chai.assert.isTrue(getResultStub.called, 'handler.getResult not called');

        fetchProductsStub.reset();
        fetchProductsStub.restore();
        getResultStub.reset();
        getResultStub.restore();
    });

    it('should call print() after handler.fetchProducts', async () => {

        const sinon = require('sinon');
        const command = require('../../commands/list-command');

        const fetchProductsStub = sinon.stub(command.handler, 'fetchProducts').resolves(undefined);
        const getResultStub = sinon.stub(command.handler, 'getResult').returns();
        const printStub = sinon.stub(command, 'print').returns();

        await command.execute();

        chai.assert.isTrue(printStub.called, 'handler.print not called');

        fetchProductsStub.reset();
        fetchProductsStub.restore();
        getResultStub.reset();
        getResultStub.restore();
        printStub.reset();
        printStub.restore();
    });
});
