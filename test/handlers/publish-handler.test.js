'use strict';

const PublishHandler = require('../../utils/publish-handler');
const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const helpers = require('../../helpers');
const sandbox = require('sinon').createSandbox();

describe('Handler: publish', () => {

    let authHandler;
    let publishHandler;
    let fakeCwd;
    let fakeProjectName;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        publishHandler = new PublishHandler(authHandler);
        fakeCwd = 'fake/cwd';
        fakeProjectName = 'fakeProjectName';

        publishHandler.cwd = fakeCwd;
        sandbox.stub(console, 'table');
        sandbox.stub(console, 'log');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler if not specyfied in constructor', (done) => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        publishHandler = new PublishHandler();
        expect(publishHandler).to.have.property('authHandler');
        expect(publishHandler.authHandler).to.be.an.instanceOf(AuthHandler);

        done();
    });

    it('should getResult method return an array', () => {

        const result = publishHandler.getResult();

        expect(result).to.be.an('array');
        expect(result).to.equal(publishHandler.result);
    });

    it('should handle missing package.json', (done) => {

        const fakeMessage = { 'Status': CliStatus.SUCCESS, 'Message': 'Fake message' };
        const createPackageJsonStub = sandbox.stub(helpers, 'createPackageJson').resolves(fakeMessage);
        const setNameStub = sandbox.stub(publishHandler, 'setProjectName');
        sandbox.stub(process, 'exit');

        publishHandler.handleMissingPackageJson()
            .then(() => {

                expect(createPackageJsonStub.calledWith(fakeCwd)).to.be.true;
                expect(publishHandler.result).to.deep.include(fakeMessage);
                expect(setNameStub.calledAfter(createPackageJsonStub)).to.be.true;
            })
            .finally(() => {

                done();
            });
    });

    it('should send error message and call process.exit if package.json not created', () => {

        const fakeMessage = { 'Status': CliStatus.SUCCESS, 'Message': 'Fake error message' };
        const createPackageJsonStub = sandbox.stub(helpers, 'createPackageJson').rejects(fakeMessage);
        sandbox.stub(process, 'exit');
        sandbox.stub(publishHandler, 'setProjectName');

        publishHandler.handleMissingPackageJson().then(() => {

            expect(createPackageJsonStub.calledWith(fakeCwd)).to.be.true;
            expect(publishHandler.result).to.deep.include(fakeMessage);
        });
    });

    it('should call handleMissingPackageJson() if package.json does not exist', async () => {

        const err = new Error('ENOENT');
        err.code = 'ENOENT';
        const joinStub = sandbox.stub(require('path'), 'join');
        joinStub.withArgs(fakeCwd, 'package.json').resolves('fake/cwd/package.json');
        joinStub.withArgs(fakeCwd, '.mdb').returns('fake/cwd/.mdb');
        sandbox.stub(helpers, 'deserializeJsonFile').rejects(err);
        const publishHandler = new PublishHandler(authHandler);
        const handleMissingPackageJsonStub = sandbox.stub(publishHandler, 'handleMissingPackageJson');

        await publishHandler.setProjectName();

        expect(handleMissingPackageJsonStub.called).to.be.true;
    });

    it('should not call handleMissingPackageJson() if error code is diffrent from ENOENT', () => {

        const err = new Error('Fake Err');
        err.code = undefined;
        const joinStub = sandbox.stub(require('path'), 'join');
        joinStub.withArgs(fakeCwd, 'package.json').resolves('fake/cwd/package.json');
        joinStub.withArgs(fakeCwd, '.mdb').returns('fake/cwd/.mdb');
        sandbox.stub(helpers, 'deserializeJsonFile').rejects(err);
        const publishHandler = new PublishHandler(authHandler);
        const handleMissingPackageJsonStub = sandbox.stub(publishHandler, 'handleMissingPackageJson');

        publishHandler.setProjectName().catch(() => {

            expect(handleMissingPackageJsonStub.called).to.be.false;
        });
    });

    it('should publish project using archiver nd return expected result after unsuccessful publication', async () => {

        const HttpWrapper = require('../../utils/http-wrapper');
        const config = require('../../config/');
        const fakePort = 1234;
        const fakeHost = 'fakeHost';
        const fakeHeader = { fake: 'fakeHeader' };
        sandbox.replace(config, 'port', fakePort);
        sandbox.replace(config, 'host', fakeHost);
        const fakeRequest = { on: sandbox.stub(), write: sandbox.stub(), end: sandbox.stub() };
        const responseOnStub = sandbox.stub();
        responseOnStub.withArgs('data').yields('fake data');
        responseOnStub.withArgs('end').yields(undefined);
        const fakeResponse = {
            on: responseOnStub,
            headers: fakeHeader,
            statusCode: 123,
            statusMessage: 'fakeMessage'
        };
        const archiveOnStub = sandbox.stub();
        archiveOnStub.withArgs('error').yields('fake err');
        archiveOnStub.withArgs('progress').yields(undefined);
        archiveOnStub.withArgs('warning').yields('fake warning');

        const finalizeStub = sandbox.stub();
        const directoryStub = sandbox.stub();
        const pipeStub = sandbox.stub();
        const archiveProject = {
            on: archiveOnStub,
            pipe: pipeStub,
            directory: directoryStub,
            finalize: finalizeStub,
            pointer: sandbox.stub().returns(123)
        };
        const createRequestStub = sandbox.stub(HttpWrapper.prototype, 'createRequest').returns(fakeRequest).yields(fakeResponse);
        sandbox.stub(require('../../helpers/archiver-wrapper'), 'archiveProject').returns(archiveProject);
        const publishHandler = new PublishHandler(authHandler);
        publishHandler.cwd = fakeCwd;
        publishHandler.projectName = fakeProjectName;

        await publishHandler.publish();

        expect(createRequestStub.calledOnce).to.be.true;
        expect(finalizeStub.calledOnce).to.be.true;
        expect(pipeStub.calledWith(fakeRequest)).to.be.true;
        expect(directoryStub.calledWith(fakeCwd, fakeProjectName)).to.be.true;
        expect(publishHandler.result).to.deep.include({ 'Status': 123, 'Message': 'fakeMessage' });
    });

    it('should publish project using archiver and return expected result after successful publication', async () => {

        const HttpWrapper = require('../../utils/http-wrapper');
        const config = require('../../config/');
        const fakePort = 1234;
        const fakeHost = 'fakeHost';
        const fakeHeader = { fake: 'fakeHeader' };
        sandbox.replace(config, 'port', fakePort);
        sandbox.replace(config, 'host', fakeHost);
        const fakeRequest = { on: sandbox.stub(), write: sandbox.stub(), end: sandbox.stub() };
        const responseOnStub = sandbox.stub();
        responseOnStub.withArgs('data').yields('fake data');
        responseOnStub.withArgs('end').yields(undefined);
        const fakeResponse = {
            on: responseOnStub,
            headers: fakeHeader,
            statusCode: CliStatus.HTTP_SUCCESS,
            statusMessage: 'fakeMessage'
        };
        const archiveOnStub = sandbox.stub();
        archiveOnStub.withArgs('error').yields('fake err');
        archiveOnStub.withArgs('progress').yields(undefined);
        archiveOnStub.withArgs('warning').yields('fake warning');

        const finalizeStub = sandbox.stub();
        const directoryStub = sandbox.stub();
        const pipeStub = sandbox.stub();
        const archiveProject = {
            on: archiveOnStub,
            pipe: pipeStub,
            directory: directoryStub,
            finalize: finalizeStub,
            pointer: sandbox.stub().returns(123)
        };
        const createRequestStub = sandbox.stub(HttpWrapper.prototype, 'createRequest').returns(fakeRequest).yields(fakeResponse);
        sandbox.stub(require('../../helpers/archiver-wrapper'), 'archiveProject').returns(archiveProject);
        const publishHandler = new PublishHandler(authHandler);
        publishHandler.cwd = fakeCwd;
        publishHandler.projectName = fakeProjectName;

        await publishHandler.publish();

        expect(createRequestStub.calledOnce).to.be.true;
        expect(finalizeStub.calledOnce).to.be.true;
        expect(pipeStub.calledWith(fakeRequest)).to.be.true;
        expect(directoryStub.calledWith(fakeCwd, fakeProjectName)).to.be.true;
        expect(publishHandler.result).to.deep.include({ Status: CliStatus.SUCCESS, Message: 'Sent 0.000 Mb' });
    });

    it('should recognize and build Angular project', async () => {

        const fs = require('fs');
        const readFileStub = sandbox.stub(fs, 'readFileSync').returns('fake file content');
        const writeFileStub = sandbox.stub(fs, 'writeFileSync');
        sandbox.stub(helpers, 'deserializeJsonFile').resolves({
            defaultProject: fakeProjectName,
            scripts: { build: 'build' },
            dependencies: { '@angular/core': '7.5.4' }
        });
        sandbox.stub(helpers, 'buildProject').resolves();
        const publishHandler = new PublishHandler(authHandler);
        publishHandler.cwd = fakeCwd;
        publishHandler.projectName = fakeProjectName;

        await publishHandler.buildProject();

        expect(readFileStub.calledOnce).to.be.true;
        expect(writeFileStub.calledOnce).to.be.true;
        expect(publishHandler.cwd).to.be.equal('fake/cwd/dist/fakeProjectName');
    });

    it('should recognize and build Vue project if config file exists', async () => {

        const fs = require('fs');
        sandbox.stub(fs, 'existsSync').returns(true);
        sandbox.stub(helpers, 'deserializeJsonFile').resolves({
            scripts: { build: 'build' },
            dependencies: { 'vue': '7.5.4' }
        });
        const buildStub = sandbox.stub(helpers, 'buildProject').resolves();
        const publishHandler = new PublishHandler(authHandler);
        publishHandler.cwd = fakeCwd;
        publishHandler.projectName = fakeProjectName;

        await publishHandler.buildProject();

        expect(buildStub.calledOnce).to.be.true;
        expect(publishHandler.cwd).to.be.equal('fake/cwd/dist');
    });

    it('should recognize Vue project and add config file if not exists', async () => {

        const fs = require('fs');
        sandbox.stub(fs, 'existsSync').returns(false);
        const writeFileStub = sandbox.stub(fs, 'writeFileSync');
        sandbox.stub(helpers, 'deserializeJsonFile').resolves({
            scripts: { build: 'build' },
            dependencies: { 'vue': '7.5.4' }
        });
        sandbox.stub(helpers, 'buildProject').resolves();
        const publishHandler = new PublishHandler(authHandler);
        publishHandler.cwd = fakeCwd;
        publishHandler.projectName = fakeProjectName;

        await publishHandler.buildProject();

        expect(writeFileStub.callCount).to.equal(1);
    });

    it('should recognize and build React project', async () => {

        const fs = require('fs');
        const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsIm5hbWUiOiJGYWtlTmFtZSIsImlzUHJvIjp0cnVlfQ.o0DZ3QXQn6mF8PEPikG27QBSuiiOJC5LktnaLzKtU8k';
        const readFileStub = sandbox.stub(fs, 'readFileSync').returns('fake file content');
        const writeFileStub = sandbox.stub(fs, 'writeFileSync');
        sandbox.stub(helpers, 'deserializeJsonFile').resolves({
            scripts: { build: 'build' },
            dependencies: { 'react': '7.5.4' }
        });
        const serializeStub = sandbox.stub(helpers, 'serializeJsonFile').resolves();
        const buildStub = sandbox.stub(helpers, 'buildProject').resolves();
        const publishHandler = new PublishHandler(authHandler);
        publishHandler.cwd = fakeCwd;
        publishHandler.projectName = fakeProjectName;
        publishHandler.authHandler.headers.Authorization = fakeToken;

        await publishHandler.buildProject();

        expect(buildStub.calledOnce).to.be.true;
        expect(serializeStub.callCount).to.equal(2);
        expect(readFileStub.callCount).to.equal(2);
        expect(writeFileStub.callCount).to.equal(2);
        expect(publishHandler.cwd).to.be.equal('fake/cwd/build');
    });

    it('should convert pointer to Mb', () => {

        publishHandler.convertToMb(1024 * 1024);

        expect(publishHandler.sent).to.equal('1.000');
    });
});
