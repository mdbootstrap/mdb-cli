'use strict';

const HttpWrapper = require('../../utils/http-wrapper');
const sandbox = require('sinon').createSandbox();
const https = require('https');
const http = require('http');

describe('Utils: HttpWrapper', () => {

    let httpRequestStub, httpsRequestStub, httpWrapper, fakeRequest, fakeResponse;

    beforeEach(() => {

        httpRequestStub = sandbox.stub(http, 'request');
        httpsRequestStub = sandbox.stub(https, 'request');
        fakeRequest = { on: sandbox.stub(), write: sandbox.stub(), end: sandbox.stub() };
        fakeResponse = { on: sandbox.stub(), headers: {} };
        httpWrapper = new HttpWrapper();
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: createRawRequest', () => {

        it('should create raw request', (done) => {

            httpRequestStub.returns(fakeRequest).yields(fakeResponse);
            httpsRequestStub.returns(fakeRequest).yields(fakeResponse);

            httpWrapper.createRawRequest({});

            expect(httpRequestStub.called || httpsRequestStub.called).to.be.true;

            done();
        });

        it('should create raw request with callback', (done) => {

            const callback = sandbox.spy();
            httpRequestStub.returns(fakeRequest).yields(fakeResponse);
            httpsRequestStub.returns(fakeRequest).yields(fakeResponse);

            httpWrapper.createRawRequest({ headers: {} }, callback);

            expect(httpRequestStub.called || httpsRequestStub.called).to.be.true;
            sandbox.assert.calledOnce(callback);

            done();
        });
    });

    describe('Method: createRequest', () => {

        it('should create request and call callback with expected arguments if response status code is in range [200, 400)', (done) => {

            const callback = sandbox.spy();
            fakeResponse.statusCode = 200;
            fakeResponse.on.withArgs('data').yields('fake data');
            fakeResponse.on.withArgs('end').yields();
            httpRequestStub.returns(fakeRequest).yields(fakeResponse);
            httpsRequestStub.returns(fakeRequest).yields(fakeResponse);

            httpWrapper.createRequest({ headers: {} }, callback);

            expect(httpRequestStub.called || httpsRequestStub.called).to.be.true;
            sandbox.assert.calledOnceWithExactly(callback, null, { body: 'fake data', statusCode: 200, headers: {} });

            done();
        });

        it('should create request and call callback with expected arguments if response status code isn\'t in range [200, 400)', (done) => {

            const callback = sandbox.spy();
            fakeResponse.statusCode = 400;
            fakeResponse.on.withArgs('data').yields('fake data');
            fakeResponse.on.withArgs('end').yields();
            httpRequestStub.returns(fakeRequest).yields(fakeResponse);
            httpsRequestStub.returns(fakeRequest).yields(fakeResponse);

            httpWrapper.createRequest({}, callback);

            expect(httpRequestStub.called || httpsRequestStub.called).to.be.true;
            sandbox.assert.calledOnceWithExactly(callback, { message: 'fake data', statusCode: 400 }, null);

            done();
        });
    });

    describe('Method: request', () => {

        it('should create request and return expected result if response status code is in range [200, 400)', async () => {

            fakeResponse.statusCode = 200;
            fakeResponse.on.withArgs('data').yields('fake data');
            fakeResponse.on.withArgs('end').yields();
            httpRequestStub.returns(fakeRequest).yields(fakeResponse);
            httpsRequestStub.returns(fakeRequest).yields(fakeResponse);

            const result = await httpWrapper.request({ headers: {}, data: '' });

            expect(httpRequestStub.called || httpsRequestStub.called).to.be.true;
            expect(result).to.be.eql({ body: 'fake data', headers: {}, statusCode: 200 });
        });

        it('should create request and return expected result if response status code isn\'t in range [200, 400)', async () => {

            fakeResponse.statusCode = 400;
            fakeResponse.on.withArgs('data').yields('fake data');
            fakeResponse.on.withArgs('end').yields();
            httpRequestStub.returns(fakeRequest).yields(fakeResponse);
            httpsRequestStub.returns(fakeRequest).yields(fakeResponse);

            try {

                await httpWrapper.request({});
            } catch (err) {

                expect(httpRequestStub.called || httpsRequestStub.called).to.be.true;
                expect(err).to.be.eql({ message: 'fake data', statusCode: 400 });
            }
        });
    });

    describe('requests', () => {

        let requestStub;

        beforeEach(() => {

            requestStub = sandbox.stub(HttpWrapper.prototype, 'request');
        });

        it('should create get request', () => {

            httpWrapper.get({});

            sandbox.assert.calledOnceWithExactly(requestStub, { method: 'GET' })
        });

        it('should create put request', () => {

            httpWrapper.put({});

            sandbox.assert.calledOnceWithExactly(requestStub, { method: 'PUT' })
        });

        it('should create post request', () => {

            httpWrapper.post({});

            sandbox.assert.calledOnceWithExactly(requestStub, { method: 'POST' })
        });

        it('should create delete request', () => {

            httpWrapper.delete({});

            sandbox.assert.calledOnceWithExactly(requestStub, { method: 'DELETE' })
        });
    });
});