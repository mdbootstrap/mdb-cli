'use strict';

const ListHandler = require('../../utils/list-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Handler: List', () => {

    let listHandler;
    let authHandler;

    beforeEach(() => {

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

    it('should have assigned authHandler if not specyfied in constructor', (done) => {

        listHandler = new ListHandler();

        expect(listHandler).to.have.property('authHandler');
        expect(listHandler.authHandler).to.be.an.instanceOf(AuthHandler);

        done();
    });

    it('should _mapToUserReadable() method return expected result', () => {

        const fakeProducts = [
            { product_id: null, product_title: 'MDB VUE 4', product_slug: 'Vue-MDB', available: true },
            { product_id: 55506, product_title: 'MDB Vue Pro', product_slug: 'vue-ui-kit', available: false }
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
            { product_id: null, product_title: 'MDB VUE 4', product_slug: 'Vue-MDB', available: true },
            { product_id: 55506, product_title: 'MDB Vue Pro', product_slug: 'vue-ui-kit', available: false }
        ];

        const helpers = require('../../helpers');
        sandbox.stub(helpers, 'fetchProducts').resolves(fakeProducts);
        listHandler = new ListHandler();
        
        expect(listHandler.fetchProducts()).to.be.a('promise');
    });

    it('should resolve if no error', () => {

        const fakeProducts = [
            { product_id: null, product_title: 'MDB VUE 4', product_slug: 'Vue-MDB', available: true },
            { product_id: 55506, product_title: 'MDB Vue Pro', product_slug: 'vue-ui-kit', available: false }
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

        listHandler.fetchProducts().then((res) => expect(res).to.be.equal(fakeError)).catch(() => {});
    });
});
