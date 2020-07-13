'use strict';

const PackageManager = require('../../utils/managers/package-manager');
const ArchiverWrapper = require('../../helpers/archiver-wrapper');
const PublishHandler = require('../../utils/publish-handler');
const AuthHandler = require('../../utils/auth-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const config = require('../../config');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

describe('Handler: publish', () => {

    const fakeCwd = 'fake/cwd';
    const fakeManager = 'fakeManager';
    const fakeDomainName = 'fakeDomainName';
    const fakeProjectName = 'fakeProjectName';
    const fakePackageName = 'fakePackageName';
    const fakePort = 1234;
    const fakeHost = 'fakeHost';
    const fakeHeader = { fake: 'fakeHeader' };
    sandbox.replace(config, 'port', fakePort);
    sandbox.replace(config, 'host', fakeHost);

    let authHandler,
        publishHandler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        publishHandler = new PublishHandler(authHandler);
        publishHandler.packageManager = fakeManager;
        publishHandler.cwd = fakeCwd;
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler if not specyfied in constructor', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        publishHandler = new PublishHandler();

        expect(publishHandler).to.have.property('authHandler');
        expect(publishHandler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should getResult method return an array', () => {

        const result = publishHandler.getResult();

        expect(result).to.be.an('array');
        expect(result).to.equal(publishHandler.result);
    });

    it('should load package manager', async () => {

        sandbox.stub(fs, 'existsSync').returns(false);
        const promptStub = sandbox.stub().resolves({ name: 'npm' });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        sandbox.stub(helpers, 'deserializeJsonFile').rejects('fakeError');

        await publishHandler.loadPackageManager();

        expect(publishHandler.packageManager).to.be.an.instanceOf(PackageManager);
    });

    describe('Method: setProjectName', () => {

        let joinStub;

        beforeEach(() => {

            joinStub = sandbox.stub(path, 'join');
            joinStub.withArgs(fakeCwd, 'package.json').resolves('fake/cwd/package.json');
            joinStub.withArgs(fakeCwd, '.mdb').returns('fake/cwd/.mdb');
        });

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should read package.json and set projectName', async () => {

            sandbox.stub(helpers, 'deserializeJsonFile').resolves({ name: fakeProjectName });

            await publishHandler.setProjectName();

            expect(publishHandler.projectName).to.be.equal(fakeProjectName);
            expect(publishHandler.domainName).to.be.equal('');
        });

        it('should read package.json and set projectName and domainName', async () => {

            sandbox.stub(helpers, 'deserializeJsonFile').resolves({ name: fakeProjectName, domainName: fakeDomainName });

            await publishHandler.setProjectName();

            expect(publishHandler.projectName).to.be.equal(fakeProjectName);
            expect(publishHandler.domainName).to.be.equal(fakeDomainName);
        });

        it('should call handleMissingPackageJson() if package.json does not exist', async () => {

            const err = new Error('ENOENT');
            err.code = 'ENOENT';
            sandbox.stub(helpers, 'deserializeJsonFile').rejects(err);
            const publishHandler = new PublishHandler(authHandler);
            const handleMissingPackageJsonStub = sandbox.stub(publishHandler, 'handleMissingPackageJson');

            await publishHandler.setProjectName();

            expect(handleMissingPackageJsonStub.called).to.be.true;
        });

        it('should not call handleMissingPackageJson() if error code is diffrent from ENOENT', async () => {

            const err = new Error('Fake Err');
            err.code = undefined;
            sandbox.stub(helpers, 'deserializeJsonFile').rejects(err);
            const publishHandler = new PublishHandler(authHandler);
            const handleMissingPackageJsonStub = sandbox.stub(publishHandler, 'handleMissingPackageJson');
            const expectedResult = { Status: CliStatus.INTERNAL_SERVER_ERROR, Message: 'Problem with reading project name: Error: Fake Err' };

            try {

                await publishHandler.setProjectName();
            } catch (err) {

                expect(handleMissingPackageJsonStub.called).to.be.false;
                expect(err).to.deep.include(expectedResult);
            }
        });
    });

    describe('Method: setPackageName', () => {

        it('should read .mdb and set packageName', async () => {

            sandbox.stub(helpers, 'deserializeJsonFile').resolves({ packageName: fakePackageName });

            await publishHandler.setPackageName();

            expect(publishHandler.packageName).to.be.equal(fakePackageName);
        });

        it('should read .mdb and set packageName', async () => {

            sandbox.stub(helpers, 'deserializeJsonFile').resolves({});

            await publishHandler.setPackageName();

            expect(publishHandler.packageName).to.be.equal('');
        });

        it('should set packageName if .mdb file does not exist', async () => {

            sandbox.stub(helpers, 'deserializeJsonFile').rejects('fakeError');

            await publishHandler.setPackageName();

            expect(publishHandler.packageName).to.be.equal('');
        });
    });

    describe('Method: handleMissingPackageJson', () => {

        it('should handle missing package.json', async () => {

            const fakeMessage = { 'Status': CliStatus.SUCCESS, 'Message': 'Fake message' };
            const createPackageJsonStub = sandbox.stub(helpers, 'createPackageJson').resolves(fakeMessage);
            const setNameStub = sandbox.stub(publishHandler, 'setProjectName').resolves();

            await publishHandler.handleMissingPackageJson();

            expect(createPackageJsonStub.calledWith(fakeManager, fakeCwd)).to.be.true;
            expect(setNameStub.calledAfter(createPackageJsonStub)).to.be.true;
            expect(publishHandler.result).to.deep.include(fakeMessage);
        });

        it('should send error message and call process.exit if package.json not created', async () => {

            const fakeMessage = { 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': 'Fake error message' };
            const expectedResult = { 'Status': CliStatus.ERROR, 'Message': 'Missing package.json file.' }
            const createPackageJsonStub = sandbox.stub(helpers, 'createPackageJson').rejects(fakeMessage);
            const setProjectNameStub = sandbox.stub(publishHandler, 'setProjectName');
            const consoleStub = sandbox.stub(console, 'table');
            const exitStub = sandbox.stub(process, 'exit');

            try {

                await publishHandler.handleMissingPackageJson();
            } catch (err) {

                expect(createPackageJsonStub.calledWith(fakeManager, fakeCwd)).to.be.true;
                expect(publishHandler.result).to.deep.include(expectedResult);
                expect(publishHandler.result).to.deep.include(fakeMessage);
                expect(setProjectNameStub.notCalled).to.be.true;
                expect(consoleStub.calledOnce).to.be.true;
                expect(exitStub.calledOnce).to.be.true;
            }
        });
    });

    describe('Method: buildProject', () => {

        const distPath = 'fake/cwd/dist';
        const buildPath = 'fake/cwd/build';

        let existsSyncStub,
            buildProjectStub,
            deserializeJsonFileStub,
            serializeJsonFileStub;

        beforeEach(() => {

            existsSyncStub = sandbox.stub(fs, 'existsSync');
            buildProjectStub = sandbox.stub(helpers, 'buildProject');
            deserializeJsonFileStub = sandbox.stub(helpers, 'deserializeJsonFile');
            serializeJsonFileStub = sandbox.stub(helpers, 'serializeJsonFile');
        });

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should resolve if no build script specyfied', async () => {

            deserializeJsonFileStub.resolves({ scripts: {} });

            await publishHandler.buildProject();

            expect(buildProjectStub.notCalled).to.be.true;
        });

        it('should reject if build folder not found', async () => {

            deserializeJsonFileStub.resolves({ scripts: { build: 'fake build script' }, dependencies: {} });
            const expectedResult = { Status: CliStatus.ERROR, Message: 'Build folder not found.' };
            existsSyncStub.returns(false);

            try {

                await publishHandler.buildProject();
            }
            catch (err) {

                expect(buildProjectStub.called).to.be.true;
                expect(err).to.deep.include(expectedResult);
            }
        });

        it('should run build and detect build folder', async () => {

            const joinStub = sandbox.stub(path, 'join');
            sandbox.stub(publishHandler, 'cwd').value(fakeCwd);
            joinStub.withArgs(fakeCwd, 'dist').returns(distPath);
            joinStub.withArgs(fakeCwd, 'build').returns(buildPath);
            deserializeJsonFileStub.resolves({ scripts: { build: 'fake build script' }, dependencies: {} });
            existsSyncStub.withArgs(distPath).returns(false);
            existsSyncStub.withArgs(buildPath).returns(true);

            await publishHandler.buildProject();

            expect(buildProjectStub.called).to.be.true;
            expect(publishHandler.cwd).to.be.equal(buildPath);
        });

        it('should run build and detect dist folder', async () => {

            const joinStub = sandbox.stub(path, 'join');
            sandbox.stub(publishHandler, 'cwd').value(fakeCwd);
            joinStub.withArgs(fakeCwd, 'dist').returns(distPath);
            joinStub.withArgs(fakeCwd, 'build').returns(buildPath);
            deserializeJsonFileStub.resolves({ scripts: { build: 'fake build script' }, dependencies: {} });
            existsSyncStub.withArgs(distPath).returns(true);
            existsSyncStub.withArgs(buildPath).returns(false);

            await publishHandler.buildProject();

            expect(buildProjectStub.called).to.be.true;
            expect(publishHandler.cwd).to.be.equal(distPath);
        });

        it('should recognize and build Angular project', async () => {

            const readFileStub = sandbox.stub(fs, 'readFileSync').returns('fake file content');
            const writeFileStub = sandbox.stub(fs, 'writeFileSync');
            deserializeJsonFileStub.resolves({
                defaultProject: fakeProjectName,
                scripts: { build: 'build' },
                dependencies: { '@angular/core': '7.5.4' }
            });
            buildProjectStub.resolves();
            publishHandler.cwd = fakeCwd;
            publishHandler.projectName = fakeProjectName;

            await publishHandler.buildProject();

            expect(readFileStub.calledOnce).to.be.true;
            expect(writeFileStub.calledOnce).to.be.true;
            expect(publishHandler.cwd).to.be.equal('fake/cwd/dist/fakeProjectName');
        });

        it('should recognize and build Vue project if config file exists', async () => {

            existsSyncStub.returns(true);
            deserializeJsonFileStub.resolves({
                scripts: { build: 'build' },
                dependencies: { 'vue': '7.5.4' }
            });
            buildProjectStub.resolves();
            publishHandler.cwd = fakeCwd;
            publishHandler.projectName = fakeProjectName;

            await publishHandler.buildProject();

            expect(buildProjectStub.calledOnce).to.be.true;
            expect(publishHandler.cwd).to.be.equal('fake/cwd/dist');
        });

        it('should recognize Vue project and add config file if not exists', async () => {

            existsSyncStub.returns(false);
            const writeFileStub = sandbox.stub(fs, 'writeFileSync');
            deserializeJsonFileStub.resolves({
                scripts: { build: 'build' },
                dependencies: { 'vue': '7.5.4' }
            });
            buildProjectStub.resolves();
            publishHandler.cwd = fakeCwd;
            publishHandler.projectName = fakeProjectName;

            await publishHandler.buildProject();

            expect(writeFileStub.callCount).to.equal(1);
        });

        it('should recognize and build React project', async () => {

            const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsIm5hbWUiOiJGYWtlTmFtZSIsImlzUHJvIjp0cnVlfQ.o0DZ3QXQn6mF8PEPikG27QBSuiiOJC5LktnaLzKtU8k';
            const readFileStub = sandbox.stub(fs, 'readFileSync').returns('fake file content');
            const writeFileStub = sandbox.stub(fs, 'writeFileSync');
            deserializeJsonFileStub.resolves({
                scripts: { build: 'build' },
                dependencies: { 'react': '7.5.4' }
            });
            existsSyncStub.returns(true);
            serializeJsonFileStub.resolves();
            buildProjectStub.resolves();
            publishHandler.cwd = fakeCwd;
            publishHandler.projectName = fakeProjectName;
            publishHandler.authHandler.headers.Authorization = fakeToken;

            await publishHandler.buildProject();

            expect(buildProjectStub.calledOnce).to.be.true;
            expect(serializeJsonFileStub.callCount).to.equal(2);
            expect(readFileStub.callCount).to.equal(3);
            expect(writeFileStub.callCount).to.equal(2);
            expect(publishHandler.cwd).to.be.equal('fake/cwd/build');
        });

        it('should recognize and build React typescript project', async () => {

            const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsIm5hbWUiOiJGYWtlTmFtZSIsImlzUHJvIjp0cnVlfQ.o0DZ3QXQn6mF8PEPikG27QBSuiiOJC5LktnaLzKtU8k';
            deserializeJsonFileStub.resolves({
                scripts: { build: 'build' },
                dependencies: { 'react': '7.5.4' }
            });
            existsSyncStub.returns(false);
            serializeJsonFileStub.resolves();
            buildProjectStub.resolves();
            publishHandler.cwd = fakeCwd;
            publishHandler.projectName = fakeProjectName;
            publishHandler.authHandler.headers.Authorization = fakeToken;

            await publishHandler.buildProject();

            expect(buildProjectStub.calledOnce).to.be.true;
            expect(serializeJsonFileStub.callCount).to.equal(2);
            expect(publishHandler.cwd).to.be.equal('fake/cwd/build');
        });
    });

    describe('Method: publish', () => {

        beforeEach(() => sandbox.stub(console, 'log'));

        it('should publish project using archiver nd return expected result after unsuccessful publication', async () => {

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
            sandbox.stub(ArchiverWrapper, 'archiveProject').returns(archiveProject);
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
            sandbox.stub(ArchiverWrapper, 'archiveProject').returns(archiveProject);
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
    });

    it('should convert pointer to Mb', () => {

        publishHandler.convertToMb(1024 * 1024);

        expect(publishHandler.sent).to.equal('1.000');
    });
});
