'use strict';

const PackageManager = require('../../utils/managers/package-manager');
const ArchiverWrapper = require('../../helpers/archiver-wrapper');
const PublishHandler = require('../../utils/publish-handler');
const AuthHandler = require('../../utils/auth-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();
const childProcess = require('child_process');
const helpers = require('../../helpers');
const config = require('../../config');
const inquirer = require('inquirer');
const fse = require('fs-extra');
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
        publishHandler.cwd = fakeCwd;
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler if not specified in constructor', () => {

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

    describe('Method: setArgs', () => {

        beforeEach(() => sandbox.stub(config, 'backendTechnologies').value(['node']));

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should set useFtp property when --ftp flag is present', async () => {

            const fakeArgs = ['--ftp'];

            await publishHandler.setArgs(fakeArgs);

            expect(publishHandler.useFtp).to.be.equal(true);
        });

        it('should set test property when --test flag is present', async () => {

            const fakeArgs = ['--test'];

            await publishHandler.setArgs(fakeArgs);

            expect(publishHandler.test).to.be.equal(true);
        });

        it('should set test property when -t flag is present', async () => {

            const fakeArgs = ['-t'];

            await publishHandler.setArgs(fakeArgs);

            expect(publishHandler.test).to.be.equal(true);
        });

        it('should not set properties when flags are not present', async () => {

            const fakeArgs = ['--abc'];

            await publishHandler.setArgs(fakeArgs);

            expect(publishHandler.test).to.be.equal(false);
            expect(publishHandler.useFtp).to.be.equal(false);
            expect(publishHandler.backendTechnology).to.be.equal(undefined);
        });

        it('should set backendTechnology property when -b flag is present', async () => {

            const fakeArgs = ['-b=node'];

            await publishHandler.setArgs(fakeArgs);

            expect(publishHandler.backendTechnology).to.be.equal('node');
        });

        it('should set backendTechnology property when --backend flag is present', async () => {

            const fakeArgs = ['--backend=node'];

            await publishHandler.setArgs(fakeArgs);

            expect(publishHandler.backendTechnology).to.be.equal('node');
        });

        it('should reject if technology is not supported', async () => {

            const fakeArgs = ['-b=php'];

            try {

                await publishHandler.setArgs(fakeArgs);
            }
            catch (err) {

                expect(publishHandler.backendTechnology).to.be.equal('php');
                expect(err).to.deep.eq({ Status: 1, Message: 'This technology is not supported. Allowed technologies: node' });
            }
        });
    });

    describe('Method: handlePublishArgs', () => {

        it('should handlePublishArgs resolve when useFtp is equal true', async () => {

            sandbox.stub(publishHandler, 'useFtp').value(true);
            const getSavedSettingsStub = sandbox.stub(publishHandler, 'getSavedSettings');

            await publishHandler.handlePublishArgs();

            expect(getSavedSettingsStub.called).to.be.false;
        });

        it('should handlePublishArgs call getSavedSettings and checkIsGitlab when useFtp is equal false', async () => {

            sandbox.stub(publishHandler, 'useFtp').value(false);
            const getSavedSettingsStub = sandbox.stub(publishHandler, 'getSavedSettings').resolves();
            const checkIsGitlabStub = sandbox.stub(publishHandler, 'checkIsGitlab').resolves();

            await publishHandler.handlePublishArgs();

            expect(getSavedSettingsStub.calledBefore(checkIsGitlabStub)).to.be.true;
        });
    });

    describe('Method: publish', () => {

        it('should publish method call console.log informing about required port 3000', async () => {

            sandbox.stub(publishHandler, 'useFtp').value(true);
            sandbox.stub(publishHandler, 'backendTechnology').value('fakeBackend');
            sandbox.stub(publishHandler, 'uploadToFtp');
            const consoleStub = sandbox.spy(console, 'log');

            await publishHandler.publish();

            expect(consoleStub.calledWith(sandbox.match.any, 'Note:', sandbox.match(/3000/))).to.be.true;
        });

        it('should publish method call uploadToFtp when useFtp is equal true', async () => {

            sandbox.stub(publishHandler, 'useFtp').value(true);
            const uploadToFtpStub = sandbox.stub(publishHandler, 'uploadToFtp');

            await publishHandler.publish();

            expect(uploadToFtpStub.calledOnce).to.be.true;
        });

        it('should publish method call useGitlabPipeline when useFtp is equal false', async () => {

            sandbox.stub(publishHandler, 'useFtp').value(false);
            const useGitlabPipelineStub = sandbox.stub(publishHandler, 'useGitlabPipeline');

            await publishHandler.publish();

            expect(useGitlabPipelineStub.calledOnce).to.be.true;
        });
    });

    describe('Method: uploadToFtp', () => {

        it('should uploadToFtp method call functions in expected order', async () => {

            const setPackageNameStub = sandbox.stub(publishHandler, 'setPackageName').resolves();
            const buildProjectStub = sandbox.stub(publishHandler, 'buildProject').resolves();
            const uploadFilesStub = sandbox.stub(publishHandler, 'uploadFiles').resolves();

            await publishHandler.uploadToFtp();

            expect(setPackageNameStub.calledBefore(buildProjectStub)).to.be.true;
            expect(buildProjectStub.calledBefore(uploadFilesStub)).to.be.true;
        });
    });

    describe('Method: useGitlabPipeline', () => {

        it('should useGitlabPipeline method call functions in expected order', async () => {

            const getProjectStatusStub = sandbox.stub(publishHandler, 'getProjectStatus').resolves();
            const getCurrentBranchStub = sandbox.stub(publishHandler, 'getCurrentBranch').resolves();
            const askAboutMergeStub = sandbox.stub(publishHandler, 'askAboutMerge').resolves();
            const pullFromGitlabStub = sandbox.stub(publishHandler, 'pullFromGitlab').resolves();
            const createJenkinsfileStub = sandbox.stub(publishHandler, 'createJenkinsfile');
            const pushToGitlabStub = sandbox.stub(publishHandler, 'pushToGitlab').resolves();
            const askAboutSaveSettingsStub = sandbox.stub(publishHandler, 'askAboutSaveSettings').resolves();

            await publishHandler.useGitlabPipeline();

            sandbox.assert.callOrder(
                getProjectStatusStub,
                getCurrentBranchStub,
                askAboutMergeStub,
                pullFromGitlabStub,
                createJenkinsfileStub,
                pushToGitlabStub,
                askAboutSaveSettingsStub
            );
        });
    });

    describe('Method: getCurrentBranch', () => {

        it('should getCurrentBranch get branch and set currentBranch on linux', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeEventEmitter = { on: sandbox.stub() };
            const errEventEmitter = { on: '' };
            const fakeReturnedStream = { ...fakeEventEmitter, stdout: fakeEventEmitter, stderr: errEventEmitter };
            const fakeBranchName = 'fakeBranchName';
            fakeReturnedStream.stdout.on.withArgs('data').yields(fakeBranchName);
            spawnStub.returns(fakeReturnedStream);

            await publishHandler.getCurrentBranch();

            expect(publishHandler.currentBranch).to.be.equal(fakeBranchName);
        });

        it('should getCurrentBranch get branch and set currentBranch on windows', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(true);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeEventEmitter = { on: sandbox.stub() };
            const errEventEmitter = { on: '' };
            const fakeReturnedStream = { ...fakeEventEmitter, stdout: fakeEventEmitter, stderr: errEventEmitter };
            const fakeBranchName = 'fakeBranchName';
            fakeReturnedStream.stdout.on.withArgs('data').yields(fakeBranchName);
            spawnStub.returns(fakeReturnedStream);

            await publishHandler.getCurrentBranch();

            expect(publishHandler.currentBranch).to.be.equal(fakeBranchName);
        });

        it('should getCurrentBranch reject on error', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeEventEmitter = { on: sandbox.stub() };
            const errEventEmitter = { on: sandbox.stub() };
            const fakeReturnedStream = { ...fakeEventEmitter, stdout: fakeEventEmitter, stderr: errEventEmitter };
            const fakeError = 'fakeError';
            fakeReturnedStream.stderr.on.withArgs('data').yields(fakeError);
            spawnStub.returns(fakeReturnedStream);

            try {

                await publishHandler.getCurrentBranch();

            } catch (err) {

                expect(err).to.be.equal(fakeError);
            }
        });
    });

    describe('Method: getProjectStatus', () => {

        it('should getProjectStatus resolve if nothing to commit', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeEventEmitter = { on: sandbox.stub() };
            const errEventEmitter = { on: sandbox.stub() };
            const fakeReturnedStream = { ...fakeEventEmitter, stdout: fakeEventEmitter, stderr: errEventEmitter };
            const fakeResult = 'nothing to commit, working tree clean';
            fakeReturnedStream.stdout.on.withArgs('data').yields(fakeResult);
            spawnStub.returns(fakeReturnedStream);

            const result = await publishHandler.getProjectStatus();

            expect(result).to.deep.include({ Status: 0, Message: 'OK' });
        });

        it('should getProjectStatus reject if user have uncommited changes', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(true);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeEventEmitter = { on: sandbox.stub() };
            const errEventEmitter = { on: sandbox.stub() };
            const fakeReturnedStream = { ...fakeEventEmitter, stdout: fakeEventEmitter, stderr: errEventEmitter };
            const fakeResult = 'Changes not staged for commit';
            fakeReturnedStream.stdout.on.withArgs('data').yields(fakeResult);
            spawnStub.returns(fakeReturnedStream);

            try {

                await publishHandler.getProjectStatus();

            } catch (err) {

                expect(err).to.deep.include({ Status: 1, Message: 'You have uncommited changes in your project, please commit and try again.' });
            }
        });

        it('should getProjectStatus reject on error', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeEventEmitter = { on: sandbox.stub() };
            const errEventEmitter = { on: sandbox.stub() };
            const fakeReturnedStream = { ...fakeEventEmitter, stdout: fakeEventEmitter, stderr: errEventEmitter };
            const fakeError = 'fakeError';
            fakeReturnedStream.stderr.on.withArgs('data').yields(fakeError);
            spawnStub.returns(fakeReturnedStream);

            try {

                await publishHandler.getProjectStatus();

            } catch (err) {

                expect(err).to.be.equal(fakeError);
            }
        });
    });

    describe('Method: askAboutMerge', () => {

        it('should askAboutMerge show checkout to master and merge current branch if confirmed', async () => {

            sandbox.stub(publishHandler, 'currentBranch').value('fakeBranch');
            sandbox.stub(helpers, 'showConfirmationPrompt').resolves(true);
            const changeStub = sandbox.stub(publishHandler, 'changeBranch').resolves();
            const mergeStub = sandbox.stub(publishHandler, 'mergeBranch');

            await publishHandler.askAboutMerge();

            expect(changeStub.calledBefore(mergeStub)).to.be.true;
        });

        it('should askAboutMerge show confirmation prompt and exit if answer is No', (done) => {

            const execStub = sandbox.stub(childProcess, 'exec');
            sandbox.stub(publishHandler, 'currentBranch').value('fakeBranch');
            sandbox.stub(helpers, 'showConfirmationPrompt').resolves(false);
            sandbox.stub(process, 'exit');

            publishHandler.askAboutMerge();

            expect(execStub.notCalled).to.be.true;

            done();
        });

        it('should askAboutMerge show confirmation prompt and reject if error', async () => {

            const fakeError = 'fakeError';
            const execStub = sandbox.stub(childProcess, 'exec');
            sandbox.stub(publishHandler, 'currentBranch').value('fakeBranch');
            sandbox.stub(helpers, 'showConfirmationPrompt').rejects(fakeError);

            try {

                await publishHandler.askAboutMerge();
            }
            catch (err) {

                expect(err.name).to.be.equal(fakeError);
            }
        });

        it('should askAboutMerge resolve immediately if current branch is master', async () => {

            sandbox.stub(publishHandler, 'currentBranch').value('master');
            const promptStub = sandbox.stub(helpers, 'showConfirmationPrompt');

            await publishHandler.askAboutMerge();

            expect(promptStub.notCalled).to.be.true;
        });
    });

    describe('Method: changeBranch', () => {

        it('should changeBranch resolve if status is SUCCESS', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub() };
            fakeReturnedStream.on.withArgs('exit').yields(0);
            sandbox.stub(publishHandler, 'currentBranch').value('fakeBranch');
            spawnStub.returns(fakeReturnedStream);

            await publishHandler.changeBranch();

            expect(publishHandler.result).to.deep.include({ Status: 0, Message: 'Switched to branch master.' });
        });

        it('should changeBranch reject if status is not SUCCESS', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(true);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub() };
            fakeReturnedStream.on.withArgs('exit').yields(500);
            sandbox.stub(publishHandler, 'currentBranch').value('fakeBranch');
            spawnStub.returns(fakeReturnedStream);

            try {

                await publishHandler.changeBranch();

            } catch (err) {

                expect(err).to.deep.include({ Status: 500, Message: 'Problem with git branch change.' });
            }
        });
    });

    describe('Method: mergeBranch', () => {

        it('should mergeBranch resolve if status is SUCCESS', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub() };
            fakeReturnedStream.on.withArgs('exit').yields(0);
            sandbox.stub(publishHandler, 'currentBranch').value('fakeBranch');
            spawnStub.returns(fakeReturnedStream);

            await publishHandler.mergeBranch();

            expect(publishHandler.result).to.deep.include({ Status: 0, Message: 'Branch fakeBranch merged into master' });
        });

        it('should mergeBranch reject on error', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(true);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub() };
            const fakeError = 'fakeError';
            fakeReturnedStream.on.withArgs('error').yields(fakeError);
            spawnStub.returns(fakeReturnedStream);

            try {

                await publishHandler.mergeBranch();

            } catch (err) {

                expect(err).to.be.equal(fakeError);
            }
        });

        it('should mergeBranch reject if status is not SUCCESS', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub() };
            fakeReturnedStream.on.withArgs('exit').yields(500);
            spawnStub.returns(fakeReturnedStream);

            try {

                await publishHandler.mergeBranch();

            } catch (err) {

                expect(err).to.deep.include({ Status: 500, Message: 'Problem with git branch merge.' });
            }
        });
    });

    describe('Method: pullFromGitlab', () => {

        it('should resolve if success', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(true);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub(), stdout: { on: sandbox.stub() }, stderr: { on: sandbox.stub() } };
            fakeReturnedStream.stdout.on.returns(fakeReturnedStream);
            fakeReturnedStream.stderr.on.returns(fakeReturnedStream);
            fakeReturnedStream.on.withArgs('exit').yields(0);
            spawnStub.returns(fakeReturnedStream);

            await publishHandler.pullFromGitlab();

            expect(publishHandler.result).to.be.an('array').that.is.empty;
        });

        it('should resolve if could not find remote ref master', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub(), stdout: { on: sandbox.stub() }, stderr: { on: sandbox.stub() } };
            fakeReturnedStream.stdout.on.returns(fakeReturnedStream);
            fakeReturnedStream.stderr.on.withArgs('data').yields("Couldn't find remote ref master").returns(fakeReturnedStream);
            fakeReturnedStream.on.withArgs('exit').yields(1).returns(fakeReturnedStream);
            spawnStub.returns(fakeReturnedStream);

            await publishHandler.pullFromGitlab();

            expect(publishHandler.result).to.be.an('array').that.is.empty;
        });

        it('should reject if code is not equal to 0', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub(), stdout: { on: sandbox.stub() }, stderr: { on: sandbox.stub() } };
            fakeReturnedStream.stdout.on.returns(fakeReturnedStream)
            fakeReturnedStream.stderr.on.withArgs('data').yields('remote: HTTP Basic: Access denied').returns(fakeReturnedStream);
            fakeReturnedStream.on.withArgs('exit').yields(1).returns(fakeReturnedStream);
            spawnStub.returns(fakeReturnedStream);

            try {

                await publishHandler.pullFromGitlab();
            }
            catch (err) {

                expect(err).to.deep.include({ Status: 1, Message: 'Problem with project fetching from GitLab.' })
            }
        });

        it('should reject if code is not equal to 0', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub(), stdout: { on: sandbox.stub() }, stderr: { on: sandbox.stub() } };
            fakeReturnedStream.on.withArgs('exit').yields(1).returns(fakeReturnedStream);
            fakeReturnedStream.stdout.on.withArgs('data').yields('asdf').returns(fakeReturnedStream);
            spawnStub.returns(fakeReturnedStream);

            try {

                await publishHandler.pullFromGitlab();
            }
            catch (err) {

                expect(err).to.deep.include({ Status: 1, Message: 'Problem with project fetching from GitLab.' })
            }
        });
    });

    describe('Method: createJenkinsfile', () => {

        let commitFileStub, createJenkinsfileStub, deserializeJsonFileStub, existsSyncStub;

        beforeEach(() => {

            existsSyncStub = sandbox.stub(fs, 'existsSync').returns(true);
            createJenkinsfileStub = sandbox.stub(helpers, 'createJenkinsfile');
            deserializeJsonFileStub = sandbox.stub(helpers, 'deserializeJsonFile');
            commitFileStub = sandbox.stub(helpers, 'commitFile');
        });

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should resolve if Jenkinsfile exists', async () => {

            existsSyncStub.returns(true);

            await publishHandler.createJenkinsfile();

            sandbox.assert.calledOnce(createJenkinsfileStub);
            sandbox.assert.notCalled(commitFileStub);
        });

        it('should create Jenkinsfile if test script exists', async () => {

            existsSyncStub.returns(false);
            createJenkinsfileStub.returns(true);
            deserializeJsonFileStub.resolves({ scripts: { test: 'fake test acript' } });

            await publishHandler.createJenkinsfile();

            sandbox.assert.calledOnce(createJenkinsfileStub);
            sandbox.assert.calledOnce(commitFileStub);
        });

        it('should create Jenkinsfile if test script does not exist', async () => {

            existsSyncStub.returns(false);
            createJenkinsfileStub.returns(true);
            deserializeJsonFileStub.resolves({});

            await publishHandler.createJenkinsfile();

            sandbox.assert.calledOnce(createJenkinsfileStub);
            sandbox.assert.calledOnce(commitFileStub);
        });
    });

    describe('Method: pushToGitlab', () => {

        it('should pushToGitlab resolve if success', async () => {

            const fakePort = 1234;
            const fakeHost = 'fakeHost';
            sandbox.replace(config, 'port', fakePort);
            sandbox.replace(config, 'host', fakeHost);
            sandbox.stub(HttpWrapper.prototype, 'post').resolves('{"Status":200,"Message":"Project data saved in database."}');
            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub() };
            fakeReturnedStream.on.withArgs('exit').yields(0);
            spawnStub.returns(fakeReturnedStream);

            await publishHandler.pushToGitlab();

            expect(publishHandler.result).to.deep.include({ 'Status': 0, 'Message': 'Success! Your project will be published using GitLab pipeline' });
            expect(publishHandler.result).to.deep.include({ 'Status': 200, 'Message': 'Project data saved in database.' });
        });

        it('should pushToGitlab reject if problem with save to database', async () => {

            const fakePort = 1234;
            const fakeHost = 'fakeHost';
            sandbox.replace(config, 'port', fakePort);
            sandbox.replace(config, 'host', fakeHost);
            const fakeError = 'Fake error';
            sandbox.stub(HttpWrapper.prototype, 'post').rejects(fakeError);
            sandbox.stub(publishHandler, 'isWindows').value(true);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub() };
            fakeReturnedStream.on.withArgs('exit').yields(0);
            spawnStub.returns(fakeReturnedStream);

            try {

                await publishHandler.pushToGitlab();

            } catch (err) {

                expect(err.name).to.be.equal(fakeError);
            }
        });

        it('should pushToGitlab reject if status code is diffrent than 0', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub() };
            fakeReturnedStream.on.withArgs('exit').yields(123);
            spawnStub.returns(fakeReturnedStream);

            try {

                await publishHandler.pushToGitlab();

            } catch (err) {

                expect(err).to.deep.include({ 'Status': 123, 'Message': 'Problem with project publishing.' });
            }
        });

        it('should pushToGitlab reject on error', async () => {

            sandbox.stub(publishHandler, 'isWindows').value(false);
            const spawnStub = sandbox.stub(childProcess, 'spawn');
            const fakeReturnedStream = { on: sandbox.stub() };
            const fakeError = 'fakeError';
            fakeReturnedStream.on.withArgs('error').yields(fakeError);
            spawnStub.returns(fakeReturnedStream);

            try {

                await publishHandler.pushToGitlab();

            } catch (err) {

                expect(err).to.be.equal(fakeError);
            }
        });
    });

    describe('Method: getSavedSettings', () => {

        it('should read .mdb file and set useGitlab if settings have been saved', async () => {

            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(path, 'join').returns('fake/path');
            sandbox.stub(helpers, 'deserializeJsonFile').resolves({ useGitlab: true });

            await publishHandler.getSavedSettings();

            expect(publishHandler.useGitlab).to.be.equal(true);
        });

        it('should read .mdb file and set useGitlab if settings have not been saved', async () => {

            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(path, 'join').returns('fake/path');
            sandbox.stub(helpers, 'deserializeJsonFile').resolves({ fake: 'settings' });

            await publishHandler.getSavedSettings();

            expect(publishHandler.useGitlab).to.be.equal(false);
        });

        it('should set useGitlab to false when .mdb file is missing', async () => {

            sandbox.stub(fs, 'existsSync').returns(false);
            sandbox.stub(path, 'join').returns('fake/path');

            await publishHandler.getSavedSettings();

            expect(publishHandler.useGitlab).to.be.equal(false);
        });

        it('should reject if .mdb file is invalid', async () => {

            sandbox.stub(path, 'join').returns('fake/path');
            sandbox.stub(helpers, 'deserializeJsonFile').rejects('Unexpected token');
            const expectedResult = { Status: 1, Message: '.mdb file is invalid. Please remove it and try again.' };

            try {

                await publishHandler.getSavedSettings();
            }
            catch (err) {

                expect(err).to.deep.equal(expectedResult);
            }
        });
    });

    describe('Method: checkIsGitlab', () => {

        const fakeUrl = 'https://fake.gitlab.url';
        const fakeFileContent = `[remote "origin"]\n\turl = ${fakeUrl}`;

        it('should checkIsGitlab set useFtp to true if it is not git repository', async () => {

            sandbox.stub(path, 'join').returns('fake/path');
            sandbox.stub(fs, 'existsSync').returns(false);

            await publishHandler.checkIsGitlab();

            expect(publishHandler.useFtp).to.be.equal(true);
        });

        it('should checkIsGitlab set useFtp to true if it is not our gitlab repository', async () => {

            sandbox.stub(path, 'join').returns('fake/path');
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns('fake file content');

            await publishHandler.checkIsGitlab();

            expect(publishHandler.useFtp).to.be.equal(true);
        });

        it('should checkIsGitlab set useGitlab to true if repoUrl is not set', async () => {

            sandbox.stub(config, 'gitlabUrl').value('https://fake.url');
            sandbox.stub(path, 'join').returns('fake/path');
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns(fakeFileContent);
            sandbox.stub(publishHandler, 'useGitlab').value(true);

            await publishHandler.checkIsGitlab();

            expect(publishHandler.useFtp).to.be.equal(true);
        });

        it('should checkIsGitlab resolve immediately if it is our gitlab repository and useGitlab is equal true', async () => {

            sandbox.stub(config, 'gitlabUrl').value(fakeUrl);
            sandbox.stub(path, 'join').returns('fake/path');
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns(fakeFileContent);
            sandbox.stub(publishHandler, 'useGitlab').value(true);

            await publishHandler.checkIsGitlab();

            expect(publishHandler.useFtp).to.be.equal(false);
        });

        it('should checkIsGitlab show confirmation prompt and set useFtp to true if answer is No', async () => {

            sandbox.stub(config, 'gitlabUrl').value(fakeUrl);
            sandbox.stub(path, 'join').returns('fake/path');
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns(fakeFileContent);
            sandbox.stub(helpers, 'showConfirmationPrompt').resolves(false);

            await publishHandler.checkIsGitlab();

            expect(publishHandler.useFtp).to.be.equal(true);
        });

        it('should checkIsGitlab show confirmation prompt and set useFtp to false if answer is Yes', async () => {

            sandbox.stub(config, 'gitlabUrl').value(fakeUrl);
            sandbox.stub(path, 'join').returns('fake/path');
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'readFileSync').returns(fakeFileContent);
            sandbox.stub(helpers, 'showConfirmationPrompt').resolves(true);

            await publishHandler.checkIsGitlab();

            expect(publishHandler.useFtp).to.be.equal(false);
        });
    });

    describe('Method: askAboutSaveSettings', () => {

        it('should askAboutSaveSettings ask and call saveSettings if answer is Yes', async () => {

            sandbox.stub(helpers, 'showConfirmationPrompt').resolves(true);
            const saveSettingsStub = sandbox.stub(publishHandler, 'saveSettings');

            await publishHandler.askAboutSaveSettings();

            expect(saveSettingsStub.calledOnce).to.be.true;
        });

        it('should askAboutSaveSettings ask and not call saveSettings if answer is No', async () => {

            sandbox.stub(helpers, 'showConfirmationPrompt').resolves(false);
            const saveSettingsStub = sandbox.stub(publishHandler, 'saveSettings');

            await publishHandler.askAboutSaveSettings();

            expect(saveSettingsStub.notCalled).to.be.true;
        });

        it('should askAboutSaveSettings not call saveSettings if settings saved earlier', async () => {

            sandbox.stub(publishHandler, 'useGitlab').value(true);
            sandbox.stub(helpers, 'showConfirmationPrompt').resolves(false);
            const saveSettingsStub = sandbox.stub(publishHandler, 'saveSettings');

            await publishHandler.askAboutSaveSettings();

            expect(saveSettingsStub.notCalled).to.be.true;
        });
    });

    describe('Method: saveSettings', () => {

        let saveMdbConfigStub, commitFileStub;

        beforeEach(() => {

            saveMdbConfigStub = sandbox.stub(helpers, 'saveMdbConfig');
            commitFileStub = sandbox.stub(helpers, 'commitFile');
        });

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should save useGitlab settings in .mdb file', async () => {

            sandbox.stub(path, 'join').returns('fake/path');
            const deserializeStub = sandbox.stub(helpers, 'deserializeJsonFile').resolves({});
            const serializeStub = sandbox.stub(helpers, 'serializeJsonFile');
            sandbox.stub(process, 'platform').value('linux');
            sandbox.stub(childProcess, 'exec');

            await publishHandler.saveSettings();

            expect(deserializeStub.calledBefore(serializeStub)).to.be.true;
        });

        it('should save useGitlab settings in .mdb file on windows', async () => {

            sandbox.stub(path, 'join').returns('fake/path');
            const deserializeStub = sandbox.stub(helpers, 'deserializeJsonFile').resolves({});
            const serializeStub = sandbox.stub(helpers, 'serializeJsonFile');
            sandbox.stub(process, 'platform').value('win32');
            sandbox.stub(childProcess, 'exec');

            await publishHandler.saveSettings();

            expect(deserializeStub.calledBefore(serializeStub)).to.be.true;
        });

        it('should create .mdb file if error code is ENOENT', async () => {

            sandbox.stub(path, 'join').returns('fake/path');
            const deserializeStub = sandbox.stub(helpers, 'deserializeJsonFile').rejects({ code: 'ENOENT' });

            await publishHandler.saveSettings();

            sandbox.assert.callOrder(deserializeStub, saveMdbConfigStub);
        });

        it('should not create .mdb file if code is diffrent from ENOENT', async () => {

            sandbox.stub(path, 'join').returns('fake/path');
            sandbox.stub(helpers, 'deserializeJsonFile').rejects({ code: 1 });

            await publishHandler.saveSettings();

            sandbox.assert.notCalled(saveMdbConfigStub);
        });
    });

    it('should load package manager', async () => {

        sandbox.stub(fs, 'existsSync').returns(false);
        const promptStub = sandbox.stub().resolves({ name: 'npm' });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        sandbox.stub(helpers, 'deserializeJsonFile').rejects('fakeError');
        sandbox.stub(publishHandler, 'useFtp').value(true);
        sandbox.stub(publishHandler, 'test').value(true);
        sandbox.stub(helpers, 'saveMdbConfig').resolves();

        await publishHandler.loadPackageManager();

        expect(publishHandler.packageManager).to.be.an.instanceOf(PackageManager);
    });

    describe('Method: runTests', () => {

        it('should resolve if test flag not set', async () => {

            const resolveStub = sandbox.stub(Promise, 'resolve');

            await publishHandler.runTests();

            expect(resolveStub.called).to.be.true;
        });

        it('should reject if error', async () => {

            sandbox.stub(publishHandler, 'test').value(true);
            sandbox.stub(publishHandler, 'loadPackageManager').resolves();
            sandbox.stub(publishHandler, 'packageManager').value({ test() { } })
            const fakeReturnedStream = { on(event = 'exit', cb) { if (event === 'exit') cb(CliStatus.ERROR); } };
            sandbox.stub(publishHandler.packageManager, 'test').returns(fakeReturnedStream);

            try {

                await publishHandler.runTests();
            }
            catch (err) {

                expect(err).to.deep.include({ Status: CliStatus.ERROR, Message: 'Tests failed' })
            }
        });

        it('should resolve if no errors', async () => {

            sandbox.stub(publishHandler, 'test').value(true);
            sandbox.stub(publishHandler, 'loadPackageManager').resolves();
            sandbox.stub(publishHandler, 'packageManager').value({ test() { } })
            const fakeReturnedStream = { on(event = 'exit', cb) { if (event === 'exit') cb(CliStatus.SUCCESS); } };
            sandbox.stub(publishHandler.packageManager, 'test').returns(fakeReturnedStream);

            const result = await publishHandler.runTests();

            expect(result).to.deep.include({ Status: CliStatus.SUCCESS, Message: 'Success' });
        });
    });

    describe('Method: setProjectName', () => {

        let deserializeJsonFileStub,
            joinStub;

        beforeEach(() => {

            joinStub = sandbox.stub(path, 'join');
            joinStub.withArgs(fakeCwd, 'package.json').resolves('fake/cwd/package.json');
            joinStub.withArgs(fakeCwd, '.mdb').returns('fake/cwd/.mdb');
            deserializeJsonFileStub = sandbox.stub(helpers, 'deserializeJsonFile');
        });

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should read package.json and set projectName', async () => {

            deserializeJsonFileStub.resolves({ name: fakeProjectName });

            await publishHandler.setProjectName();

            expect(publishHandler.projectName).to.be.equal(fakeProjectName);
            expect(publishHandler.domainName).to.be.equal('');
        });

        it('should read package.json and set projectName and domainName', async () => {

            deserializeJsonFileStub.resolves({ name: fakeProjectName, domainName: fakeDomainName });

            await publishHandler.setProjectName();

            expect(publishHandler.projectName).to.be.equal(fakeProjectName);
            expect(publishHandler.domainName).to.be.equal(fakeDomainName);
        });

        it('should call handleMissingPackageJson() if package.json does not exist', async () => {

            const err = new Error('ENOENT');
            err.code = 'ENOENT';
            deserializeJsonFileStub.rejects(err);
            const handleMissingPackageJsonStub = sandbox.stub(publishHandler, 'handleMissingPackageJson');

            await publishHandler.setProjectName();

            expect(handleMissingPackageJsonStub.called).to.be.true;
        });

        it('should call setPhpProjectName() if it is a php project', async () => {

            const err = new Error('ENOENT');
            err.code = 'ENOENT';
            deserializeJsonFileStub.rejects(err);
            sandbox.stub(publishHandler, 'backendTechnology').value('php7');
            const setPhpProjectNameStub = sandbox.stub(publishHandler, 'setPhpProjectName');

            await publishHandler.setProjectName();

            sandbox.assert.calledOnce(setPhpProjectNameStub);
        });

        it('should not call handleMissingPackageJson() if error code is diffrent from ENOENT', async () => {

            const err = new Error('Fake Err');
            err.code = undefined;
            deserializeJsonFileStub.rejects(err);
            const handleMissingPackageJsonStub = sandbox.stub(publishHandler, 'handleMissingPackageJson');
            const expectedResult = { Status: CliStatus.INTERNAL_SERVER_ERROR, Message: 'Problem with reading project name: Error: Fake Err' };

            try {

                await publishHandler.setProjectName();
            }
            catch (err) {

                expect(handleMissingPackageJsonStub.called).to.be.false;
                expect(err).to.deep.include(expectedResult);
            }
        });
    });

    describe('Method: setPhpProjectName', () => {

        let existsSyncStub,
            deserializeJsonFileStub,
            serializeJsonFileStub,
            showTextPromptStub,
            writeFileSyncStub;

        beforeEach(() => {

            existsSyncStub = sandbox.stub(fs, 'existsSync');
            deserializeJsonFileStub = sandbox.stub(helpers, 'deserializeJsonFile');
            serializeJsonFileStub = sandbox.stub(helpers, 'serializeJsonFile');
            showTextPromptStub = sandbox.stub(helpers, 'showTextPrompt');
            writeFileSyncStub = sandbox.stub(fs, 'writeFileSync');
        });

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should set php project name if defined in .mdb file', async () => {

            existsSyncStub.returns(true);
            deserializeJsonFileStub.resolves({ projectName: fakeProjectName });

            await publishHandler.setPhpProjectName();

            expect(publishHandler.projectName).to.be.eq(fakeProjectName);
        });

        it('should set php project name if not defined in .mdb file', async () => {

            existsSyncStub.returns(true);
            deserializeJsonFileStub.resolves({});
            showTextPromptStub.resolves(fakeProjectName);
            serializeJsonFileStub.resolves();

            await publishHandler.setPhpProjectName();

            expect(publishHandler.projectName).to.be.eq(fakeProjectName);
            sandbox.assert.calledOnce(serializeJsonFileStub);
        });

        it('should set php project name if .mdb file does not exist', async () => {

            existsSyncStub.returns(false);
            showTextPromptStub.resolves(fakeProjectName);

            await publishHandler.setPhpProjectName();

            expect(publishHandler.projectName).to.be.eq(fakeProjectName);
            sandbox.assert.calledOnce(writeFileSyncStub);
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
            sandbox.stub(publishHandler, 'loadPackageManager').resolves();
            sandbox.stub(publishHandler, 'packageManager').value(fakeManager);
            const createPackageJsonStub = sandbox.stub(helpers, 'createPackageJson').resolves(fakeMessage);
            const setNameStub = sandbox.stub(publishHandler, 'setProjectName').resolves();

            await publishHandler.handleMissingPackageJson();

            expect(createPackageJsonStub.calledWith(fakeManager, fakeCwd)).to.be.true;
            expect(setNameStub.calledAfter(createPackageJsonStub)).to.be.true;
            expect(publishHandler.result).to.deep.include(fakeMessage);
        });

        it('should send error message and call process.exit if package.json not created', async () => {

            sandbox.stub(publishHandler, 'loadPackageManager').resolves();
            const fakeMessage = { 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': 'Fake error message' };
            const expectedResult = { 'Status': CliStatus.ERROR, 'Message': 'Missing package.json file.' }
            const createPackageJsonStub = sandbox.stub(helpers, 'createPackageJson').rejects(fakeMessage);
            const setProjectNameStub = sandbox.stub(publishHandler, 'setProjectName');
            const consoleStub = sandbox.stub(console, 'table');
            const exitStub = sandbox.stub(process, 'exit');

            try {

                await publishHandler.handleMissingPackageJson();
            }
            catch (err) {

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
        const packageJsonPath = 'fake/cwd/package.json';


        let consoleLogStub,
            existsSyncStub,
            buildProjectStub,
            deserializeJsonFileStub,
            serializeJsonFileStub;

        beforeEach(() => {

            consoleLogStub = sandbox.stub(console, 'log');
            existsSyncStub = sandbox.stub(fs, 'existsSync');
            sandbox.stub(publishHandler, 'loadPackageManager').resolves();
            buildProjectStub = sandbox.stub(helpers, 'buildProject');
            deserializeJsonFileStub = sandbox.stub(helpers, 'deserializeJsonFile');
            serializeJsonFileStub = sandbox.stub(helpers, 'serializeJsonFile');
        });

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should resolve if no build script specified', async () => {

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
                expect(consoleLogStub.called).to.be.true;
            }
        });

        it('should run build and detect build folder', async () => {

            const joinStub = sandbox.stub(path, 'join');
            sandbox.stub(publishHandler, 'cwd').value(fakeCwd);
            joinStub.withArgs(fakeCwd, 'dist').returns(distPath);
            joinStub.withArgs(fakeCwd, 'build').returns(buildPath);
            joinStub.withArgs(fakeCwd, 'package.json').returns(packageJsonPath);
            deserializeJsonFileStub.resolves({ scripts: { build: 'fake build script' }, dependencies: {} });
            existsSyncStub.withArgs(packageJsonPath).returns(true);
            existsSyncStub.withArgs(distPath).returns(false);
            existsSyncStub.withArgs(buildPath).returns(true);

            await publishHandler.buildProject();

            expect(buildProjectStub.called).to.be.true;
            expect(publishHandler.cwd).to.be.equal(fakeCwd);
            expect(consoleLogStub.called).to.be.true;
        });

        it('should run build and detect dist folder', async () => {

            const joinStub = sandbox.stub(path, 'join');
            sandbox.stub(publishHandler, 'cwd').value(fakeCwd);
            joinStub.withArgs(fakeCwd, 'dist').returns(distPath);
            joinStub.withArgs(fakeCwd, 'build').returns(buildPath);
            joinStub.withArgs(fakeCwd, 'package.json').returns(packageJsonPath);
            deserializeJsonFileStub.resolves({ scripts: { build: 'fake build script' }, dependencies: {} });
            existsSyncStub.withArgs(packageJsonPath).returns(true);
            existsSyncStub.withArgs(distPath).returns(true);
            existsSyncStub.withArgs(buildPath).returns(false);

            await publishHandler.buildProject();

            expect(buildProjectStub.called).to.be.true;
            expect(publishHandler.cwd).to.be.equal(fakeCwd);
            expect(consoleLogStub.called).to.be.true;
        });

        it('should recognize and build Angular project', async () => {

            const readFileStub = sandbox.stub(fs, 'readFileSync').returns('fake file content');
            const writeFileStub = sandbox.stub(fs, 'writeFileSync');
            const moveSyncStub = sandbox.stub(fse, 'moveSync');
            deserializeJsonFileStub.resolves({
                defaultProject: fakeProjectName,
                scripts: { build: 'build' },
                dependencies: { '@angular/core': '7.5.4' }
            });
            buildProjectStub.resolves();
            publishHandler.cwd = fakeCwd;
            publishHandler.projectName = fakeProjectName;
            existsSyncStub.returns(true);

            await publishHandler.buildProject();

            expect(readFileStub.calledOnce).to.be.true;
            expect(writeFileStub.calledOnce).to.be.true;
            expect(moveSyncStub.calledTwice).to.be.true;
            expect(publishHandler.cwd).to.be.equal(fakeCwd);
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
            expect(publishHandler.cwd).to.be.equal(fakeCwd);
        });

        it('should recognize Vue project and add config file if not exists', async () => {

            existsSyncStub.onFirstCall().returns(true);
            existsSyncStub.onSecondCall().returns(false);
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
            expect(readFileStub.callCount).to.equal(2);
            expect(writeFileStub.callCount).to.equal(2);
            expect(publishHandler.cwd).to.be.equal(fakeCwd);
        });

        it('should recognize and build React typescript project', async () => {

            const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsIm5hbWUiOiJGYWtlTmFtZSIsImlzUHJvIjp0cnVlfQ.o0DZ3QXQn6mF8PEPikG27QBSuiiOJC5LktnaLzKtU8k';
            deserializeJsonFileStub.resolves({
                scripts: { build: 'build' },
                dependencies: { 'react': '7.5.4' }
            });
            existsSyncStub.onFirstCall().returns(true);
            existsSyncStub.onSecondCall().returns(false);
            serializeJsonFileStub.resolves();
            buildProjectStub.resolves();
            publishHandler.cwd = fakeCwd;
            publishHandler.projectName = fakeProjectName;
            publishHandler.authHandler.headers.Authorization = fakeToken;

            await publishHandler.buildProject();

            expect(buildProjectStub.calledOnce).to.be.true;
            expect(serializeJsonFileStub.callCount).to.equal(2);
            expect(publishHandler.cwd).to.be.equal(fakeCwd);
        });
    });

    describe('Method: uploadFiles', () => {

        beforeEach(() => sandbox.stub(console, 'log'));

        it('should publish project using archiver and return expected result after unsuccessful publication', async () => {

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
            const globStub = sandbox.stub();
            const directoryStub = sandbox.stub();
            const pipeStub = sandbox.stub();
            const archiveProject = {
                on: archiveOnStub,
                pipe: pipeStub,
                glob: globStub,
                directory: directoryStub,
                finalize: finalizeStub,
                pointer: sandbox.stub().returns(123)
            };
            const createRequestStub = sandbox.stub(HttpWrapper.prototype, 'createRequest').returns(fakeRequest).yields(fakeResponse);
            sandbox.stub(ArchiverWrapper, 'archiveProject').returns(archiveProject);
            publishHandler.cwd = fakeCwd;
            publishHandler.backendTechnology = 'node';
            publishHandler.projectName = fakeProjectName;
            const globOptions = { cwd: fakeCwd, ignore: ['node_modules/**', '.git/**', '.gitignore', 'Dockerfile', '.dockerignore', '.idea/**'] };

            await publishHandler.uploadFiles();

            expect(createRequestStub.calledOnce).to.be.true;
            expect(finalizeStub.calledOnce).to.be.true;
            expect(pipeStub.calledWith(fakeRequest)).to.be.true;
            expect(globStub.calledWith('**', globOptions)).to.be.true;
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
            const globStub = sandbox.stub();
            const directoryStub = sandbox.stub();
            const pipeStub = sandbox.stub();
            const archiveProject = {
                on: archiveOnStub,
                pipe: pipeStub,
                glob: globStub,
                directory: directoryStub,
                finalize: finalizeStub,
                pointer: sandbox.stub().returns(123)
            };
            const createRequestStub = sandbox.stub(HttpWrapper.prototype, 'createRequest').returns(fakeRequest).yields(fakeResponse);
            sandbox.stub(ArchiverWrapper, 'archiveProject').returns(archiveProject);
            publishHandler.cwd = fakeCwd;
            publishHandler.projectName = fakeProjectName;
            const globOptions = { cwd: fakeCwd, ignore: ['node_modules/**', '.git/**', '.gitignore', 'Dockerfile', '.dockerignore', '.idea/**'] };

            await publishHandler.uploadFiles();

            expect(createRequestStub.calledOnce).to.be.true;
            expect(finalizeStub.calledOnce).to.be.true;
            expect(pipeStub.calledWith(fakeRequest)).to.be.true;
            expect(globStub.calledWith('**', globOptions)).to.be.true;
            expect(publishHandler.result).to.deep.include({ Status: CliStatus.SUCCESS, Message: 'Sent 0.000 Mb' });
        });
    });

    it('should convert pointer to Mb', () => {

        publishHandler.convertToMb(1024 * 1024);

        expect(publishHandler.sent).to.equal('1.000');
    });
});
