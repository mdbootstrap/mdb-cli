'use strict';

const AuthHandler = require('../../utils/auth-handler');
const InitHandler = require('../../utils/init-handler');
const HttpWrapper = require('../../utils/http-wrapper');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();
const childProcess = require('child_process');
const helpers = require('../../helpers');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const path = require('path');
const fs = require('fs');

describe('Handler: Init', () => {

    const fakePath = 'fake/path';
    const fakeSelect = { projectSlug: 'fakeProjectSlug' };

    let authHandler,
        initHandler,
        joinStub,
        platformStub,
        promptStub,
        spawnStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        initHandler = new InitHandler(authHandler);
        joinStub = sandbox.stub(path, 'join').returns(fakePath);
        promptStub = sandbox.stub().resolves(fakeSelect);
        platformStub = sandbox.stub(process, 'platform');
        spawnStub = sandbox.stub(childProcess, 'spawn');
        sandbox.stub(console, 'table');
        sandbox.stub(fse, 'remove');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        initHandler = new InitHandler();

        expect(initHandler).to.have.property('authHandler');
        expect(initHandler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should set handler args', () => {

        const fakeProjectName = 'fake-project-name';

        initHandler.setArgs(['-b', '-n', fakeProjectName, '--blank']);

        expect(initHandler.args.projectName).to.be.equal(fakeProjectName);
        expect(initHandler.args.blank).to.be.equal(true);
    });

    describe('Method: saveMetadata', () => {

        it('should resolve if no error and send expected message', async () => {

            sandbox.stub(helpers, 'serializeJsonFile').resolves();
            const expectedResult = { 'Status': CliStatus.SUCCESS, 'Message': 'Project metadata saved.' };

            await initHandler.saveMetadata();

            expect(initHandler.result).to.deep.include(expectedResult);
        });

        it('should resolve if error and send expected message', async () => {

            sandbox.stub(helpers, 'serializeJsonFile').rejects();
            const expectedResult = { 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': 'Project metadata not saved.' };

            await initHandler.saveMetadata();

            expect(initHandler.result).to.deep.include(expectedResult);
        });
    });

    describe('Method: getAvailableOptions', () => {

        const fakeError = new Error('fake error');
        const fakeResult = 'fake result';

        it('should resolve if --blank flag is set', async () => {

            sandbox.stub(initHandler.args, 'blank').value(true);
            const promiseStub = sandbox.stub(Promise, 'resolve');

            await initHandler.getAvailableOptions();

            expect(promiseStub.called).to.be.true;
        });

        it('should fetch, parse and return sorted products', async () => {

            const fakeOptions = { fake: 'options' };
            sandbox.stub(helpers, 'fetchProducts').resolves(fakeOptions);
            const getStub = sandbox.stub(helpers, 'getSorted').returns(fakeResult);

            await initHandler.getAvailableOptions();

            expect(getStub.calledWith(fakeOptions)).to.be.true;
            expect(initHandler.options).to.equal(fakeResult);
        });

        it('should fetch products and return sorted result', async () => {

            const fakeOptions = 'options';
            sandbox.stub(helpers, 'getSorted').returns(fakeResult);
            sandbox.stub(helpers, 'fetchProducts').resolves(fakeOptions);
            sandbox.stub(JSON, 'parse');

            await initHandler.getAvailableOptions();

            expect(initHandler.options).to.equal(fakeResult);
        });

        it('should catch error if rejected', async () => {

            sandbox.stub(helpers, 'fetchProducts').rejects(fakeError);

            try {

                await initHandler.getAvailableOptions();
            }
            catch (e) {

                expect(e).to.be.equal(fakeError);
            }
        });
    });

    describe('Method: showUserPrompt', () => {

        it('should resolve if --blank flag is set', async () => {

            sandbox.stub(initHandler.args, 'blank').value(true);
            const promiseStub = sandbox.stub(Promise, 'resolve');

            await initHandler.showUserPrompt();

            expect(promiseStub.called).to.be.true;
        });

        it('should show user prompt and handle user selection', async () => {

            const createPromptModuleStub = sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
            const handleSelectStub = sandbox.stub(initHandler, '_handleUserProjectSelect');

            await initHandler.showUserPrompt();

            expect(handleSelectStub.calledWith(fakeSelect)).to.be.true;
            expect(handleSelectStub.calledAfter(createPromptModuleStub)).to.be.true;
        });
    });

    describe('Method: _handleUserProjectSelect', () => {

        it('should exit if prompt shown count is greater than 10 and send expected message', () => {

            const fakeSelect = { projectSlug: 'angular-ui-kit' };
            const fakeResult = [{
                product_id: 16867,
                product_title: 'Material Design for Bootstrap Pro (Angular version)',
                product_slug: 'angular-ui-kit',
                available: true
            }];

            sandbox.stub(initHandler, '_setProjectInfo');
            const exitStub = sandbox.stub(process, 'exit');

            initHandler.result = fakeResult;
            initHandler._promptShownCount = 11;

            initHandler._handleUserProjectSelect(fakeSelect);

            expect(console.table.calledWith([{ 'Status': CliStatus.SEE_OTHER, 'Message': 'Please run `mdb list` to see available packages.' }])).to.be.true;
            expect(exitStub.calledWith(0)).to.be.true;
        });

        it('should handle user project selection if project is not available', () => {

            const fakeSelect = { projectSlug: 'angular-ui-kit' };
            const fakeResult = [{ productId: 16867, productTitle: 'MDB Pro (Angular version)', productSlug: 'angular-ui-kit', available: false }];
            const consoleStub = sandbox.stub(console, 'log');
            const promptStub = sandbox.stub(initHandler, 'showUserPrompt');
            initHandler.options = fakeResult;

            initHandler._handleUserProjectSelect(fakeSelect);

            expect(consoleStub.calledWith('You cannot create this project. Please visit https://mdbootstrap.com/products/angular-ui-kit/ and make sure it is available for you.')).to.be.true;
            expect(promptStub.calledAfter(consoleStub)).to.be.true;
        });

        it('should handle user project selection if project is available', () => {

            const fakeSelect = { projectSlug: 'angular-ui-kit' };
            const fakeResult = [{ productId: 16867, productTitle: 'MDB Pro (Angular version)', productSlug: 'angular-ui-kit', available: true }];
            const infoStub = sandbox.stub(initHandler, '_setProjectInfo');
            initHandler.options = fakeResult;

            initHandler._handleUserProjectSelect(fakeSelect);

            expect(infoStub.calledWith(fakeResult[0])).to.be.true;
        });

        it('should handle the user project selection if an empty project has been selected', () => {

            const fakeSelect = { projectSlug: 'blank' };
            const promiseStub = sandbox.stub(Promise, 'resolve');

            initHandler._handleUserProjectSelect(fakeSelect);

            expect(initHandler.args.blank).to.be.true;
            expect(promiseStub.called).to.be.true;
        });
    });

    describe('Method: _setProjectInfo', () => {

        it('should set free project data', () => {

            const fakeProject = { productId: null, productTitle: 'MDB Pro (Angular version)', productSlug: 'angular-ui-kit', available: true };
            joinStub.returns('fake/path/angular-ui-kit');
            initHandler.cwd = 'fake/path';

            initHandler._setProjectInfo(fakeProject);

            expect(initHandler.projectRoot).to.equal('fake/path/angular-ui-kit');
        });

        it('should set project name if specyfied', () => {

            const fakeProject = { productId: 345, productTitle: 'MDB Pro (Angular version)', productSlug: 'angular-ui-kit', available: true };
            initHandler.cwd = 'fake/path';
            initHandler.args.projectName = 'fakeProjectName';

            initHandler._setProjectInfo(fakeProject);

            expect(initHandler.projectName).to.equal('fakeProjectName');
        });
    });

    describe('Method: initProject', () => {

        let existsSyncStub, confirmationPromptStub, downloadStub, initEmptyProjectStub;

        beforeEach(() => {

            existsSyncStub = sandbox.stub(fs, 'existsSync');
            confirmationPromptStub = sandbox.stub(helpers, 'showConfirmationPrompt');
            initEmptyProjectStub = sandbox.stub(initHandler, '_initEmptyProject');
            downloadStub = sandbox.stub(initHandler, '_download');
        });

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should init project', () => {

            existsSyncStub.returns(false);
            spawnStub.returns(promptStub);

            initHandler.initProject();

            expect(downloadStub.calledAfter(existsSyncStub)).to.be.true;
            expect(initEmptyProjectStub.notCalled).to.be.true;
        });

        it('should init empty project', async () => {

            existsSyncStub.returns(false);
            spawnStub.returns(promptStub);
            sandbox.stub(initHandler.args, 'blank').value(true);

            await initHandler.initProject();

            expect(downloadStub.notCalled).to.be.true;
            expect(initEmptyProjectStub.calledAfter(existsSyncStub)).to.be.true;
        });

        it('should init empty project if confirmed', async () => {

            existsSyncStub.returns(true);
            confirmationPromptStub.resolves(true);
            sandbox.stub(initHandler.args, 'blank').value(true);
            spawnStub.returns(confirmationPromptStub);

            await initHandler.initProject();

            expect(downloadStub.notCalled).to.be.true;
            expect(initEmptyProjectStub.calledAfter(confirmationPromptStub)).to.be.true;
        });

        it('should init project if confirmed', async () => {

            existsSyncStub.returns(true);
            confirmationPromptStub.resolves(true);
            spawnStub.returns(confirmationPromptStub);

            await initHandler.initProject();

            expect(initEmptyProjectStub.notCalled).to.be.true;
            expect(downloadStub.calledAfter(confirmationPromptStub)).to.be.true;
        });

        it('should not init project if not confirmed', async () => {

            existsSyncStub.returns(true);
            confirmationPromptStub.resolves(false);
            const expectedResult = { Status: CliStatus.SUCCESS, Message: 'OK, will not initialize project in this location.' };

            await initHandler.initProject();

            expect(downloadStub.called).to.be.false;
            expect(initEmptyProjectStub.called).to.be.false;
            expect(initHandler.result).to.deep.include(expectedResult);
        });
    });

    describe('Method: _download', () => {

        it('should download pro starter', async () => {

            const fakeResult = [{ Status: CliStatus.SUCCESS, Message: 'Initialization completed.' }];
            const eraseStub = sandbox.stub(helpers, 'eraseProjectDirectories').resolves();
            sandbox.stub(helpers, 'gitClone').resolves(fakeResult);
            const downloadStub = sandbox.stub(helpers, 'downloadProStarter').resolves(fakeResult);
            initHandler.projectSlug = 'fakeSlug';
            initHandler.projectName = 'fakeName';
            initHandler.authHaders = 'fakeHeaders';
            initHandler.cwd = 'fakeCwd';
            initHandler.isFreePackage = false;
            initHandler.projectRoot = 'fake/project/root';
            sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
            const saveMetaStub = sandbox.stub(initHandler, 'saveMetadata').resolves();
            const notifyStub = sandbox.stub(initHandler, 'notifyServer').resolves();

            await initHandler._download();

            expect(eraseStub.calledBefore(downloadStub), 'eraseProjectDirectories not called').to.be.true;
            expect(downloadStub.calledBefore(saveMetaStub), 'removeGitFolder not called').to.be.true;
            expect(saveMetaStub.calledBefore(notifyStub), 'saveMetadata not called').to.be.true;
        });

        it('should catch error if rejected', async () => {

            const fakeError = new Error('fake error');
            sandbox.stub(helpers, 'eraseProjectDirectories').rejects(fakeError);

            try {

                await initHandler._download();
            }
            catch (e) {

                expect(initHandler.result).to.be.equal([fakeError]);
            }
        });
    });

    describe('Method: _initEmptyProject', () => {

        beforeEach(() => {

            sandbox.stub(helpers, 'eraseProjectDirectories').resolves();
            sandbox.stub(initHandler, 'askForProjectName').resolves();
            sandbox.stub(initHandler, 'createDirectory').resolves();
        });

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should return an expected result', async () => {

            const expectedResult = { Status: CliStatus.SUCCESS, Message: 'Project created' };
            sandbox.stub(initHandler, 'createPackageJson').resolves(expectedResult);

            await initHandler._initEmptyProject();

            expect(initHandler.result).to.deep.include(expectedResult);
        });

        it('should return an expected result if error', async () => {

            const expectedResult = { Status: CliStatus.ERROR, Message: 'Project not created' };
            sandbox.stub(initHandler, 'createPackageJson').rejects(expectedResult);

            try {

                await initHandler._initEmptyProject();
            }
            catch (err) {

                expect(err).to.deep.include(expectedResult);
            }
        });
    });

    describe('Method: askForProjectName', () => {

        const fakeProjectName = 'fake-project-name';

        it('should resolve if project name is set', async () => {

            sandbox.stub(initHandler.args, 'projectName').value(fakeProjectName);

            await initHandler.askForProjectName();

            expect(initHandler.projectName).to.be.equal(fakeProjectName);
        });

        it('should show prompt and get project name', async () => {

            sandbox.stub(helpers, 'showTextPrompt').resolves(fakeProjectName);

            await initHandler.askForProjectName();

            expect(initHandler.projectName).to.be.equal(fakeProjectName);
        });
    });

    describe('Method: createDirectory', () => {

        let mkdirStub;

        beforeEach(() => {

            sandbox.stub(initHandler, 'cwd').value('fake/cwd');
            sandbox.stub(initHandler, 'projectName').value('fakeName');
            mkdirStub = sandbox.stub(fs, 'mkdir');
        });

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should reject with message if error', async () => {

            mkdirStub.yields('Fake error');

            try {

                await initHandler.createDirectory();

            } catch (err) {

                expect(err).to.deep.include({ Status: CliStatus.ERROR, Message: 'Error: Fake error' });
            }
        });

        it('should resolve if no errors', async () => {

            mkdirStub.yields(null);

            const result = await initHandler.createDirectory();

            expect(result).to.be.undefined;
            expect(mkdirStub.called).to.be.true;
        });
    });

    describe('Method: createPackageJson', () => {

        beforeEach(() => {

            sandbox.stub(initHandler, 'cwd').value('fake/cwd');
            sandbox.stub(initHandler, 'projectName').value('fakeName');
        });

        afterEach(() => {

            sandbox.reset();
            sandbox.restore();
        });

        it('should reject if error', async () => {

            const fakeReturnedStream = { on(event = 'error', cb) { if (event === 'error') cb(new Error('Fake error')); } };
            spawnStub.returns(fakeReturnedStream);
            platformStub.value('linux');

            try {

                await initHandler.createPackageJson();
            }
            catch (err) {

                expect(err).to.deep.include({ Status: CliStatus.ERROR, Message: 'Fake error' });
            }
        });

        it('should reject if code is diffrent than 0', async () => {

            const code = 1;
            const fakeReturnedStream = { on(event = 'exit', cb) { if (event === 'exit') cb(code); } };
            spawnStub.returns(fakeReturnedStream);
            platformStub.value('win32');

            try {

                await initHandler.createPackageJson();
            }
            catch (err) {

                expect(err).to.deep.include({ Status: code, Message: 'Problem with npm initialization' });
            }
        });

        it('should resolve if code is 0', async () => {

            const code = 0;
            const fakeReturnedStream = { on(event = 'exit', cb) { if (event === 'exit') cb(code); } };
            spawnStub.returns(fakeReturnedStream);
            platformStub.value('linux');

            const result = await initHandler.createPackageJson();

            expect(result).to.deep.include({ 'Status': code, Message: 'Project fakeName successfully created' });
        });
    });

    describe('Method: notifyServer', () => {

        it('should notify server', async () => {

            const postStub = sandbox.stub(HttpWrapper.prototype, 'post');

            await initHandler.notifyServer();

            expect(postStub.calledOnce).to.be.true;
        });
    });
});
