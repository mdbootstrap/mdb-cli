'use strict';

const { fetchProducts } = require('../../helpers/fetch-products');
const HttpWrapper = require('../../utils/http-wrapper');
const config = require('../../config');
const sandbox = require('sinon').createSandbox();

describe('Helper: fetch products', () => {

    const fakePort = 0;
    const fakeHost = 'fakeHost';
    let getStub;

    beforeEach(() => {

        sandbox.replace(config, 'port', fakePort);
        sandbox.replace(config, 'host', fakeHost);
        getStub = sandbox.stub(HttpWrapper.prototype, 'get');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should return promise', () => {

        getStub.resolves(JSON.stringify({}));

        expect(fetchProducts()).to.be.a('promise');
    });

    it('should call HttpWrapper.get', async () => {

        getStub.resolves(JSON.stringify({}));

        await fetchProducts();

        expect(getStub.calledOnce).to.be.true;
    });

    it('should create HttpWrapper with expected option', () => {

        const headers = { fake: 'fake' };
        const expectedOptions = {
            port: fakePort,
            hostname: fakeHost,
            path: '/packages/read',
            method: 'GET',
            data: '',
            headers: headers
        };
        const expectedResult = new HttpWrapper(expectedOptions);
        getStub.resolves(JSON.stringify({}));

        fetchProducts(headers);

        expect(getStub.thisValues[0]).to.be.deep.equal(expectedResult);
    });

    it('should return expected results', async () => {

        const expectedResults = { fake: 'fake' };
        getStub.resolves(JSON.stringify(expectedResults));

        const result = await fetchProducts();

        expect(result).to.be.deep.equal(expectedResults);
    });
});
