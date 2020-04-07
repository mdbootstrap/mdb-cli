'use strict';

const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();

describe('Handler: unset-domain-name', () => {

    let authHandler;
    let handler;

    beforeEach(() => {

        const handlerClass = require('../../utils/unset-domain-name-handler');
        authHandler = new AuthHandler(false);

        handler = new handlerClass(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have `result` property', () => {

        expect(handler).to.have.property('result');
    });

    it('should `result` be an array', () => {

        expect(handler.result).to.be.a('array');
    });

    it('should have `authHandler` property', () => {

        expect(handler).to.have.property('authHandler');
    });

    it('should have assigned authHandler', () => {

        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should have assigned authHandler if not specified in constructor', (done) => {

        const handlerClass = require('../../utils/unset-domain-name-handler');
        handler = new handlerClass();
        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);

        done();
    });

    it('should getResult() return result array', () => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'getResult() returns invalid result');
    });

    it('should unsetDomainName() remove project domain name', async () => {

        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        sandbox.stub(deserializer, 'deserializeJsonFile').resolves({ domainName: 'fake.domain.name' });
        sandbox.stub(serializer, 'serializeJsonFile').resolves();

        const expectedResults = { 'Status': CliStatus.SUCCESS, 'Message': 'Domain name has been deleted successfully' };

        expect(handler.result).to.be.an('array').that.is.empty;

        await handler.unsetDomainName();

        expect(handler.result).to.deep.include(expectedResults);
    });

    it('should return expected result if problem with file deserialization', async () => {

        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const fileName = 'package.json';
        const expectedResults = { 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with reading ${fileName}` };
        const fakeError = new Error('fake error');
        sandbox.stub(serializer, 'serializeJsonFile').resolves(undefined);
        sandbox.stub(deserializer, 'deserializeJsonFile').rejects(fakeError);
        sandbox.stub(console, 'log');

        try {

            await handler.unsetDomainName();
        } catch (e) {

            expect(e).to.deep.include(expectedResults);
        }
    });

    it('should return expected result if problem with file serialization', async () => {

        const fs = require('fs');
        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const fileName = 'package.json';
        const expectedResults = { 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with saving ${fileName}` };
        const fakeError = new Error('fake error');
        sandbox.stub(serializer, 'serializeJsonFile').rejects(fakeError);
        sandbox.stub(deserializer, 'deserializeJsonFile').resolves({ domainName: 'fake.domain.name' });
        sandbox.stub(fs, 'writeFile');
        sandbox.stub(console, 'log');

        try {

            await handler.unsetDomainName();

        } catch (err) {

            expect(err).to.deep.include(expectedResults);
        }
    });

    it('should reject when no domain name specyfied', async () => {

        const deserializer = require('../../helpers/deserialize-object-from-file');
        const expectedResults = { Status: 404, Message: 'No domain name' };
        sandbox.stub(deserializer, 'deserializeJsonFile').resolves({name: 'name'});

        try {

            await handler.unsetDomainName();

        } catch (err) {

            expect(err).to.deep.include(expectedResults);
        }
    });

});
