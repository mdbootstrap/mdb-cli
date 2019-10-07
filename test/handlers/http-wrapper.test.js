'use strict';

const HttpWrapper = require('../../utils/http-wrapper');
const http = require('http');
const sandbox = require('sinon').createSandbox();

describe('Utils: Http Wrapper', () => {

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call http.request method', (done) => {

        const fakeHeader = { fake: 'fakeHeader' };
        const fakeRequest = { on: sandbox.stub(), write: sandbox.stub(), end: sandbox.stub() };
        const fakeResponse = { on: sandbox.stub(), headers: fakeHeader };
        const requestStub = sandbox.stub(http, 'request').returns(fakeRequest).yields(fakeResponse);
        const fakeOptions = { data: { fake: 'data' } };
        const httpWrapper = new HttpWrapper(fakeOptions);

        httpWrapper.createRequest();

        expect(requestStub.called).to.equal(true);

        done();
    });

    it('should call callback if it exists', (done) => {

        const fakeHeader = { fake: 'fakeHeader' };
        const fakeRequest = { on: sandbox.stub(), write: sandbox.stub(), end: sandbox.stub() };
        const fakeResponse = { on: sandbox.stub(), headers: fakeHeader };
        sandbox.stub(http, 'request').returns(fakeRequest).yields(fakeResponse);
        const fakeOptions = { data: 'fake data' };
        const httpWrapper = new HttpWrapper(fakeOptions);
        const fakeCallback = sandbox.stub();

        httpWrapper.createRequest(fakeCallback);

        expect(fakeCallback.calledWith(fakeResponse)).to.be.true;

        done();
    });

    it('should reject if response status code is not between 200 and 400', () => {

        const http = require('http');
        const fakeHeader = { fake: 'fakeHeader' };
        const fakeRequest = { on: sandbox.stub(), write: sandbox.stub(), end: sandbox.stub() };
        const fakeResponse = { on: sandbox.stub().withArgs('end').yields(''), headers: fakeHeader, statusCode: 404 };
        sandbox.stub(http, 'request').returns(fakeRequest).yields(fakeResponse);
        const fakeOptions = { data: 'fake data' };
        const httpWrapper = new HttpWrapper(fakeOptions);

        httpWrapper.request().catch(err => expect(err).to.equal(404));
    });

    it('should resolve if response status code is between 200 and 400', () => {

        const http = require('http');
        const fakeHeader = { fake: 'fakeHeader' };
        const fakeRequest = { on: sandbox.stub(), write: sandbox.stub(), end: sandbox.stub() };
        const fakeResponse = { on: sandbox.stub().withArgs('end').yields(''), headers: fakeHeader, statusCode: 210 };
        sandbox.stub(http, 'request').returns(fakeRequest).yields(fakeResponse);
        const fakeOptions = { data: {fake: 'data'} };
        const httpWrapper = new HttpWrapper(fakeOptions);

        httpWrapper.request().then(res => expect(res).to.equal(210)).catch(() => { });
    });

    it('should convert _requestData to string if it type is diffrent', () => {

        const http = require('http');
        const fakeHeader = { fake: 'fakeHeader' };
        const fakeRequest = { on: sandbox.stub(), write: sandbox.stub(), end: sandbox.stub() };
        const fakeResponse = { on: sandbox.stub().withArgs('end').yields(''), headers: fakeHeader, statusCode: 210 };
        sandbox.stub(http, 'request').returns(fakeRequest).yields(fakeResponse);
        const fakeOptions = { data: {fake: 'data'} };
        const stringifyStub = sandbox.stub(JSON, 'stringify');
        const httpWrapper = new HttpWrapper(fakeOptions);

        httpWrapper.request().then(() => expect(stringifyStub.calledOnce).to.equal(true)).catch(() => { });
    });

    it('should create get request', () => {

        sandbox.stub(http, 'request');
        const fakeOptions = { data: 'fake data' };
        const httpWrapper = new HttpWrapper(fakeOptions);

        httpWrapper.get().then(() => expect(httpWrapper._options.method).to.equal('GET')).catch(() => { });
    });

    it('should create post request', () => {

        sandbox.stub(http, 'request');
        const fakeOptions = { data: 'fake data' };
        const httpWrapper = new HttpWrapper(fakeOptions);

        httpWrapper.post().then(() => expect(httpWrapper._options.method).to.equal('POST')).catch(() => { });
    });

    it('should create put request', () => {

        sandbox.stub(http, 'request');
        const fakeOptions = { data: 'fake data' };
        const httpWrapper = new HttpWrapper(fakeOptions);

        httpWrapper.put().then(() => expect(httpWrapper._options.method).to.equal('PUT')).catch(() => { });
    });
});
