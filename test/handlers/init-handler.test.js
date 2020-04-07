'use strict';

const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const helpers = require('../../helpers');
const sandbox = require('sinon').createSandbox();
const inquirer = require('inquirer');

describe('Handler: Init', () => {

    let initHandler;
    const fakePath = 'fake/path';
    let authHandler;
    let InitHandler;
    const fakeSelect = { projectSlug: 'fakeProjectSlug' };
    let promptStub;

    beforeEach(() => {

        sandbox.stub(require('fs-extra'), 'remove');
        sandbox.stub(console, 'table');
        promptStub = sandbox.stub().resolves(fakeSelect);
        InitHandler = require('../../utils/init-handler');
        authHandler = new AuthHandler(false);
    });

    afterEach(() => {

        authHandler = undefined;
        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        initHandler = new InitHandler();

        expect(initHandler).to.have.property('authHandler');
        expect(initHandler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should saveMetadata() resolves if no error and send expected message', async () => {

        const serialize = require('../../helpers/serialize-object-to-file');
        sandbox.stub(require('path'), 'join').returns(fakePath);
        sandbox.stub(serialize, 'serializeJsonFile').resolves();
        const expectedResult = { 'Status': CliStatus.SUCCESS, 'Message': 'Project metadata saved.' };

        initHandler = new InitHandler(authHandler);

        await initHandler.saveMetadata();

        expect(initHandler.result).to.deep.include(expectedResult);
    });

    it('should saveMetadata() resolves if error and send expected message', async () => {

        const serialize = require('../../helpers/serialize-object-to-file');
        sandbox.stub(require('path'), 'join').returns(fakePath);
        sandbox.stub(serialize, 'serializeJsonFile').rejects();
        const expectedResult = { 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': 'Project metadata not saved.' };

        initHandler = new InitHandler(authHandler);

        await initHandler.saveMetadata();

        expect(initHandler.result).to.deep.include(expectedResult);
    });

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

        initHandler = new InitHandler(authHandler);

        initHandler.result = fakeResult;
        initHandler._promptShownCount = 11;
        initHandler._handleUserProjectSelect(fakeSelect);

        expect(console.table.calledWith([{ 'Status': CliStatus.SEE_OTHER, 'Message': 'Please run `mdb list` to see available packages.' }])).to.be.true;
        expect(exitStub.calledWith(0)).to.be.true;
    });

    it('should getAvailableOptions() fetch, parse and return sorted products', async () => {

        const fakeOptions = { fake: 'options' };
        const fakeResult = 'fake result';
        sandbox.stub(helpers, 'fetchProducts').resolves(fakeOptions);
        const getStub = sandbox.stub(helpers, 'getSorted').returns(fakeResult);
        initHandler = new InitHandler(authHandler);

        await initHandler.getAvailableOptions();

        expect(getStub.calledWith(fakeOptions)).to.be.true;
        expect(initHandler.options).to.equal(fakeResult);

    });

    it('should getAvailableOptions() fetch products and return sorted result', async () => {

        const fakeOptions = 'options';
        const fakeResult = 'fake result';
        sandbox.stub(helpers, 'getSorted').returns(fakeResult);
        sandbox.stub(helpers, 'fetchProducts').resolves(fakeOptions);
        sandbox.stub(JSON, 'parse');
        initHandler = new InitHandler(authHandler);

        await initHandler.getAvailableOptions();

        expect(initHandler.options).to.equal(fakeResult);
    });

    it('should getAvailableOptions() catch error if rejected', async () => {

        const fakeError = new Error('fake error');
        sandbox.stub(helpers, 'fetchProducts').rejects(fakeError);
        initHandler = new InitHandler(authHandler);

        try{

            await initHandler.getAvailableOptions();
        } catch(e) {

            expect(e).to.be.equal(fakeError);
        }
    });

    it('should handle user project selection if project is not available', () => {

        const fakeSelect = { projectSlug: 'angular-ui-kit' };
        const fakeResult = [{ productId: 16867, productTitle: 'MDB Pro (Angular version)', productSlug: 'angular-ui-kit', available: false }];

        initHandler = new InitHandler(authHandler);

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

        initHandler = new InitHandler(authHandler);
        const infoStub = sandbox.stub(initHandler, '_setProjectInfo');
        initHandler.options = fakeResult;

        initHandler._handleUserProjectSelect(fakeSelect);

        expect(infoStub.calledWith(fakeResult[0])).to.be.true;
    });

    it('should _setProjectInfo method set free project data', () => {

        const fakeProject = { productId: null, productTitle: 'MDB Pro (Angular version)', productSlug: 'angular-ui-kit', available: true };
        initHandler.cwd = 'fake/path';

        initHandler._setProjectInfo(fakeProject);

        expect(initHandler.projectRoot).to.equal('fake/path/angular-ui-kit');
    });

    it('should _setProjectInfo method set project name if specyfied', () => {

        const fakeProject = { productId: 345, productTitle: 'MDB Pro (Angular version)', productSlug: 'angular-ui-kit', available: true };
        initHandler.cwd = 'fake/path';
        initHandler.args.projectName = 'fakeProjectName';

        initHandler._setProjectInfo(fakeProject);

        expect(initHandler.projectName).to.equal('fakeProjectName');
    });

    it('should init project', () => {

        sandbox.stub(require('path'), 'join');
        const existsStub = sandbox.stub(require('fs'), 'existsSync').returns(false);

        initHandler = new InitHandler(authHandler);
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        const downloadStub = sandbox.stub(initHandler, '_download');

        initHandler.initProject();

        expect(downloadStub.calledAfter(existsStub)).to.be.true;
    });

    it('should init project if confirmed', async () => {

        sandbox.stub(require('path'), 'join');
        sandbox.stub(require('fs'), 'existsSync').returns(true);
        const promptStub = sandbox.stub(helpers, 'showConfirmationPrompt').resolves(true);

        initHandler = new InitHandler(authHandler);

        const downloadStub = sandbox.stub(initHandler, '_download');
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        await initHandler.initProject();

        expect(downloadStub.calledAfter(promptStub)).to.be.true;
    });

    it('should not init project if not confirmed', async () => {

        sandbox.stub(require('path'), 'join');
        sandbox.stub(require('fs'), 'existsSync').returns(true);
        const promptStub = sandbox.stub(helpers, 'showConfirmationPrompt').resolves(false);

        initHandler = new InitHandler(authHandler);

        const downloadStub = sandbox.stub(initHandler, '_download');
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        await initHandler.initProject();

        expect(downloadStub.called).to.be.false;
    });

    it('should notifyServer() method notify server', async () => {

        const HttpWrapper = require('../../utils/http-wrapper');
        const postStub = sandbox.stub(HttpWrapper.prototype, 'post');

        initHandler = new InitHandler(authHandler);
        await initHandler.notifyServer();

        expect(postStub.calledOnce).to.be.true;
    });

    it('should download pro starter', async () => {

        const fakeResult = [{ Status: CliStatus.SUCCESS, Message: 'Initialization completed.' }];
        const eraseStub = sandbox.stub(helpers, 'eraseProjectDirectories').resolves();
        sandbox.stub(helpers, 'gitClone').resolves(fakeResult);
        const downloadStub = sandbox.stub(helpers, 'downloadProStarter').resolves(fakeResult);
        initHandler = new InitHandler(authHandler);
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

    it('should _download catch error if rejected', async () => {

        const fakeError = new Error('fake error');
        sandbox.stub(helpers, 'eraseProjectDirectories').rejects(fakeError);
        initHandler = new InitHandler(authHandler);
        
        try {

            await initHandler._download();
        } catch(e) {

            expect(initHandler.result).to.be.equal([fakeError]);
        }
    });

    it('should show user prompt and handle user select', () => {

        const createPromptModuleStub = sandbox.stub(require('inquirer'), 'createPromptModule').returns(promptStub);
        initHandler = new InitHandler(authHandler);
        const handleSelectStub = sandbox.stub(initHandler, '_handleUserProjectSelect');

        initHandler.showUserPrompt().then(() => {

            expect(handleSelectStub.calledWith(fakeSelect)).to.be.true;
            expect(handleSelectStub.calledAfter(createPromptModuleStub)).to.be.true;
        });
    });
});
