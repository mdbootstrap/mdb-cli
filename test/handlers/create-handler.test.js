'use strict';

const CreateHandler = require('../../utils/create-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const cp = require('child_process');
const fs = require('fs');

describe('Handler: Create', () => {

    let authHandler,
        handler;

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

        } catch (err) {

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

        const fakeResult = { name: 'fakeName', url: 'http://fake/repo.url', saved: true, webhook: true, pipeline: true };
        sandbox.stub(HttpWrapper.prototype, 'post').resolves(fakeResult);
        const expectedResult = { Status: CliStatus.HTTP_SUCCESS, Message: 'Project fakeName successfully created. Repository url: http://fake/repo.url ' };

        await handler.create();

        expect(handler.result).to.deep.include(expectedResult);
    });

    it('should create() method request the server and return and parse expected result', async () => {

        const fakeResult = '{"name":"fakeName","url":"http://fake/repo.url","saved":false,"webhook":false,"pipeline":false}';
        const res1 = { Status: CliStatus.HTTP_SUCCESS, Message: 'Project fakeName successfully created. Repository url: http://fake/repo.url ' };
        const res2 = { Status: CliStatus.ERROR, Message: 'Project data not saved. Please write to our support https://mdbootstrap.com/support/' };
        const res3 = { Status: CliStatus.ERROR, Message: 'Jenkins pipeline not created. Please write to our support https://mdbootstrap.com/support/' };
        sandbox.stub(HttpWrapper.prototype, 'post').resolves(fakeResult);

        await handler.create();

        expect(handler.result).to.deep.include(res1);
        expect(handler.result).to.deep.include(res2);
        expect(handler.result).to.deep.include(res3);
    });

    describe('Method: pushToGitlab', () => {

        const fakeError = new Error('fakeError');
        const fakeGutlabUrl = 'http://fake/repo.url';

        let existsSyncStub, execStub, logStub;

        beforeEach(() => {

            existsSyncStub = sandbox.stub(fs, 'existsSync');
            execStub = sandbox.stub(cp, 'exec');
            logStub = sandbox.stub(console, 'log');
            sandbox.stub(handler, 'gitlabUrl').value(fakeGutlabUrl);
        });

        it('should add remote and push to gitlab', async () => {

            existsSyncStub.returns(true);
            execStub.yields(undefined);

            await handler.pushToGitlab();

            sandbox.assert.calledWith(execStub, `git remote set-url origin ${fakeGutlabUrl} && git push -u origin master`);
        });

        it('should try to add remote and reject if error', async () => {

            existsSyncStub.returns(true);
            execStub.yields(fakeError);

            try {

                await handler.pushToGitlab();
            }
            catch (err) {

                sandbox.assert.calledWith(execStub, `git remote set-url origin ${fakeGutlabUrl} && git push -u origin master`);
                expect(err).to.be.equal('fakeError');
            }
        });

        it('should try to add remote and and resolve if authentication failed', async () => {

            existsSyncStub.returns(true);
            execStub.yields(new Error('authentication failed'));

            await handler.pushToGitlab();

            sandbox.assert.calledTwice(logStub);
            sandbox.assert.calledWith(execStub, `git remote set-url origin ${fakeGutlabUrl} && git push -u origin master`);
        });

        it('should init repo and push to gitlab', async () => {

            existsSyncStub.returns(false);
            execStub.yields(undefined);

            await handler.pushToGitlab();

            sandbox.assert.calledWith(execStub, `git init && git remote add origin ${fakeGutlabUrl} && git add . && git commit -m "Initial commit" && git push -u origin master`);
        });

        it('should try to init repository and reject if error', async () => {

            existsSyncStub.returns(false);
            execStub.yields(fakeError);

            try {

                await handler.pushToGitlab();
            }
            catch (err) {

                sandbox.assert.calledWith(execStub, `git init && git remote add origin ${fakeGutlabUrl} && git add . && git commit -m "Initial commit" && git push -u origin master`);
                expect(err).to.be.equal('fakeError');
            }
        });

        it('should try to init repository and resolve if authentication failed', async () => {

            existsSyncStub.returns(false);
            execStub.yields(new Error('authentication failed'));

            await handler.pushToGitlab();

            sandbox.assert.calledTwice(logStub);
            sandbox.assert.calledWith(execStub, `git init && git remote add origin ${fakeGutlabUrl} && git add . && git commit -m "Initial commit" && git push -u origin master`);
        });
    });
});
