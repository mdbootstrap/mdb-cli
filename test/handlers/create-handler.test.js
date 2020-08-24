'use strict';

const CreateHandler = require('../../utils/create-handler');
const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const helpers = require('../../helpers');
const sandbox = require('sinon').createSandbox();

describe('Handler: Create', () => {

    let authHandler;
    let handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new CreateHandler(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assign authHandler', () => {

        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should have assigned authHandler if not specified in constructor', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        handler = new CreateHandler();
        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should getResult() return result array', () => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'getResult() returns invalid result');
    });

    it('should getProjectName() return expected result', async () => {

        const expectedResult = 'fakeName';
        sandbox.stub(helpers, 'deserializeJsonFile').resolves({ name: expectedResult });

        await handler.getProjectName();

        expect(handler.name).to.be.equal(expectedResult);
    });

    it('should getProjectName() reject if problem with reading package.json', async () => {

        sandbox.stub(helpers, 'deserializeJsonFile').rejects('fakeError');
        const logStub = sandbox.stub(console, 'log');

        try {

            await handler.getProjectName();

        } catch(err) {
            
            expect(logStub.calledOnce).to.be.true;
            expect(err).to.deep.include({ Status: CliStatus.ERROR, Message: 'Problem with reading package.json' });
        }
        
    });

    it('should addJenkinsfile call createJenkinsfile helper', async () => {

        const fakeCwd = 'fake/dierctory/path';
        const createJenkinsfileStub = sandbox.stub(helpers, 'createJenkinsfile');
        sandbox.stub(handler, 'cwd').value(fakeCwd);

        await handler.addJenkinsfile();

        sandbox.assert.calledOnce(createJenkinsfileStub);
        sandbox.assert.calledWith(createJenkinsfileStub, fakeCwd);
    });

    it('should create() request the server and return expected result', async () => {

        const HttpWrapper = require('../../utils/http-wrapper');
        const fakeResult = { name: 'fakeName', url: 'http://fake/repo.url', saved: true, webhook: true, pipeline: true };
        sandbox.stub(HttpWrapper.prototype, 'post').resolves(fakeResult);
        const expectedResult = { Status: CliStatus.HTTP_SUCCESS, Message: 'Project fakeName successfully created. Repository url: http://fake/repo.url' };
        const logStub = sandbox.stub(console, 'log');

        await handler.create();

        expect(logStub.callCount).to.be.equal(3);
        expect(handler.result).to.deep.include(expectedResult);
    });

    it('should create() method request the server and return and parse expected result', async () => {

        const HttpWrapper = require('../../utils/http-wrapper');
        const fakeResult = '{"name":"fakeName","url":"http://fake/repo.url","saved":false,"webhook":false,"pipeline":false}';
        const res1 = { Status: CliStatus.HTTP_SUCCESS, Message: 'Project fakeName successfully created. Repository url: http://fake/repo.url' };
        const res2 = { Status: CliStatus.ERROR, Message: 'Project data not saved. Please write to our support https://mdbootstrap.com/support/' };
        const res3 = { Status: CliStatus.ERROR, Message: 'Jenkins pipeline not created. Please write to our support https://mdbootstrap.com/support/' };
        sandbox.stub(HttpWrapper.prototype, 'post').resolves(fakeResult);
        const logStub = sandbox.stub(console, 'log');

        await handler.create();

        expect(logStub.callCount).to.be.equal(3);
        expect(handler.result).to.deep.include(res1);
        expect(handler.result).to.deep.include(res2);
        expect(handler.result).to.deep.include(res3);
    });
});
