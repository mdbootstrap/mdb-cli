'use strict';

const ListHandler = require('../../utils/list-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Handler: List', () => {

    let listHandler;
    let authHandler;

    beforeEach(() => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        authHandler = new AuthHandler(true);
        listHandler = new ListHandler(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHeaders', () => {

        expect(listHandler).to.have.property('authHeaders');
    });

    it('should have assigned authHandler if not specified in constructor', (done) => {

        listHandler = new ListHandler();

        expect(listHandler).to.have.property('authHandler');
        expect(listHandler.authHandler).to.be.an.instanceOf(AuthHandler);

        done();
    });

    it('should _mapToUserReadable() method return expected result', () => {

        const fakeProducts = [
            { productId: null, productTitle: 'MDB VUE 4', productSlug: 'Vue-MDB', available: true },
            { productId: 55506, productTitle: 'MDB Vue Pro', productSlug: 'vue-ui-kit', available: false }
        ];
        const expectedResult = [
            { 'Product Name': 'MDB VUE 4', 'Available': 'Yes' },
            { 'Product Name': 'MDB Vue Pro', 'Available': 'No ( https://mdbootstrap.com/products/vue-ui-kit/ )' }
        ];
        const result = listHandler._mapToUserReadable(fakeProducts);

        expect(result).to.deep.equal(expectedResult);
    });

    it('should fetchProducts() method return a promise', () => {

        const fakeProducts = [
            { productId: null, productTitle: 'MDB VUE 4', productSlug: 'Vue-MDB', available: true },
            { productId: 55506, productTitle: 'MDB Vue Pro', productSlug: 'vue-ui-kit', available: false }
        ];

        const helpers = require('../../helpers');
        sandbox.stub(helpers, 'fetchProducts').resolves(fakeProducts);
        listHandler = new ListHandler();

        expect(listHandler.fetchProducts()).to.be.a('promise');
    });

    it('should resolve if no error', () => {

        const fakeProducts = [
            { productId: null, productTitle: 'MDB VUE 4', productSlug: 'Vue-MDB', available: true },
            { productId: 55506, productTitle: 'MDB Vue Pro', productSlug: 'vue-ui-kit', available: false }
        ];
        const expectedResult = [
            { 'Product Name': 'MDB VUE 4', 'Available': 'Yes' },
            { 'Product Name': 'MDB Vue Pro', 'Available': 'No ( https://mdbootstrap.com/products/vue-ui-kit/ )' }
        ];

        const helpers = require('../../helpers');
        sandbox.stub(helpers, 'fetchProducts').resolves(fakeProducts);
        listHandler = new ListHandler();

        listHandler.fetchProducts().then(() => {

            expect(listHandler.result).to.deep.equal(expectedResult);
        });
    });

    it('should reject if error', () => {

        const helpers = require('../../helpers');
        const fakeError = new Error('fake error');
        sandbox.stub(helpers, 'fetchProducts').rejects(fakeError);
        listHandler = new ListHandler();

        listHandler.fetchProducts().then((res) => expect(res).to.be.equal(fakeError)).catch(() => { });
    });
});
