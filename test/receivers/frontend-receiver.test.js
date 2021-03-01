'use strict';

const config = require('../../config');
const Context = require('../../context');
const FrontendReceiver = require('../../receivers/frontend-receiver');
const FtpPublishStrategy = require('../../receivers/strategies/publish/ftp-publish-strategy');
const PipelinePublishStrategy = require('../../receivers/strategies/publish/pipeline-publish-strategy');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const fs = require('fs');

describe('Receiver: frontend', () => {

    let context, receiver;

    beforeEach(() => {

        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: list', () => {

        beforeEach(() => {

            sandbox.stub(config, 'projectsDomain').value('fake.domain');
        });

        it('should set expected result if user does not have any projects', async () => {

            context = new Context('frontend', 'list', '', []);
            receiver = new FrontendReceiver(context);
            sandbox.stub(receiver.http, 'get').resolves({ body: '[]' });

            await receiver.list();

            expect(receiver.result.messages[0].value).to.eql('You don\'t have any projects yet.');
        });

        it('should set expected result if user has projects', async () => {

            const fakeProject1 = {
                projectId: 1,
                userNicename: 'fakeuser1',
                projectName: 'fakeproject1',
                domainName: null,
                publishDate: '2019-06-24T06:49:53.000Z',
                editDate: '2019-06-24T06:49:53.000Z',
                repoUrl: null,
                status: 'published',
                projectMeta: []
            };
            const fakeProject2 = {
                projectId: 2,
                userNicename: 'fakeuser2',
                projectName: 'fakeproject2',
                domainName: 'fake.domain.name',
                publishDate: '2019-06-24T06:49:53.000Z',
                editDate: '2019-06-24T06:49:53.000Z',
                repoUrl: 'fake.repo.url',
                status: 'created',
                projectMeta: [{ metaKey: '_uploaded_to_ftp', metaValue: '0' }]
            };
            const expectedResult = [{
                'Project Name': 'fakeproject1',
                'Project URL': `https://fake.domain/fakeuser1/fakeproject1/`,
                'Published': new Date(fakeProject1.publishDate).toLocaleString(),
                'Edited': new Date(fakeProject1.editDate).toLocaleString(),
                'Repository': '-'
            }, {
                'Project Name': 'fakeproject2',
                'Project URL': 'Unavailable',
                'Published': '-',
                'Edited': new Date(fakeProject1.editDate).toLocaleString(),
                'Repository': 'fake.repo.url'
            }];
            sandbox.stub(FrontendReceiver.prototype, 'getFrontendProjects').resolves([fakeProject1, fakeProject2]);
            context = new Context('frontend', 'list', '', []);
            receiver = new FrontendReceiver(context);

            await receiver.list();

            expect(receiver.result.messages[0].value).to.eql(expectedResult);
        });
    });

    describe('Method: init', () => {

        const fakeProduct = {
            productTitle: 'fakeTitle',
            productSlug: 'fake-slug',
            available: true,
            category: 'fakeCategory',
            license: 'fakeLicense',
            displayName: 'fakeName',
            code: 'fake-slug'
        };

        let createConfirmationPromptStub,
            createJenkinsfileStub,
            createListPromptStub,
            createTextPromptStub,
            downloadFromFTPStub,
            eraseDirectoriesStub,
            existsSyncStub,
            getStub;

        beforeEach(() => {

            context = new Context('frontend', 'init', [], []);
            receiver = new FrontendReceiver(context);
            getStub = sandbox.stub(receiver.http, 'get');
            sandbox.stub(receiver.context.mdbConfig, 'setValue');
            sandbox.stub(receiver.context.mdbConfig, 'save');
            sandbox.stub(receiver.context, '_loadPackageJsonConfig');
            sandbox.stub(receiver.context, 'packageJsonConfig').value({});
            sandbox.stub(process, 'cwd').returns('fake/cwd');
            createConfirmationPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt');
            createJenkinsfileStub = sandbox.stub(helpers, 'createJenkinsfile');
            createListPromptStub = sandbox.stub(helpers, 'createListPrompt');
            createTextPromptStub = sandbox.stub(helpers, 'createTextPrompt');
            eraseDirectoriesStub = sandbox.stub(helpers, 'eraseDirectories');
            downloadFromFTPStub = sandbox.stub(helpers, 'downloadFromFTP');
            existsSyncStub = sandbox.stub(fs, 'existsSync');
            sandbox.stub(fs, 'rmdirSync');
        });

        it('should download selected project starter if available', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Success' }, color: 'green' };
            getStub.resolves({ body: JSON.stringify([fakeProduct]) });
            createListPromptStub.resolves('fake-slug');
            existsSyncStub.returns(false);
            eraseDirectoriesStub.resolves();
            downloadFromFTPStub.resolves('Success');
            createJenkinsfileStub.resolves();

            await receiver.init();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should try download selected project and return expected result if not available', async () => {

            const expectedResult = { type: 'text', value: 'Please run `mdb starter ls` to see available packages.' };
            getStub.resolves({ body: JSON.stringify([{ ...fakeProduct, ...{ available: false } }]) });
            createListPromptStub.resolves('fake-slug');

            await receiver.init();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set new name, download selected project and return expected result if project already exists', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Success' }, color: 'green' };
            getStub.resolves({ body: JSON.stringify([fakeProduct]) });
            createListPromptStub.resolves('fake-slug');
            existsSyncStub.withArgs('fake/cwd/fake-slug').returns(true);
            existsSyncStub.withArgs('fake/cwd/new-fake-slug').returns(false);
            createConfirmationPromptStub.resolves(true);
            createTextPromptStub.resolves('new-fake-slug');
            eraseDirectoriesStub.resolves();
            downloadFromFTPStub.resolves('Success');
            createJenkinsfileStub.resolves();

            await receiver.init();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should download selected project and return expected result if project already exists and user doesn\'t want to erase it', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'OK, will not delete existing folder.' }, color: 'red' };
            getStub.resolves({ body: JSON.stringify([fakeProduct]) });
            createListPromptStub.resolves('fake-slug');
            existsSyncStub.withArgs('fake/cwd/fake-slug').returns(true);
            createConfirmationPromptStub.resolves(false);
            eraseDirectoriesStub.returns(Promise.reject('OK, will not delete existing folder.'));

            await receiver.init();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: get', () => {

        const fakeProject = {
            projectId: 1,
            userNicename: 'fakeuser',
            projectName: 'fakeproject',
            domainName: null,
            publishDate: '2019-06-24T06:49:53.000Z',
            editDate: '2019-06-24T06:49:53.000Z',
            repoUrl: null,
            status: 'published',
            projectMeta: []
        };

        let getFrontendProjectsStub;

        beforeEach(() => {

            sandbox.stub(config, 'projectsDomain').value('fake.domain');
            getFrontendProjectsStub = sandbox.stub(FrontendReceiver.prototype, 'getFrontendProjects');
        });

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getFrontendProjectsStub.resolves([]);
            context = new Context('frontend', 'get', '', []);
            receiver = new FrontendReceiver(context);

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'get', '', ['-n', 'fakename']);
            receiver = new FrontendReceiver(context);

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is downloaded from ftp', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Download completed.' }, color: 'green' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'get', '', ['--name', 'fakeproject']);
            receiver = new FrontendReceiver(context);
            sandbox.stub(helpers, 'eraseDirectories').resolves();
            sandbox.stub(helpers, 'downloadFromFTP').resolves('Download completed.');

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is downloaded using git', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Download completed.' }, color: 'green' };
            const fakeProject1 = { ...fakeProject, ...{ repoUrl: 'fake.url' } };
            getFrontendProjectsStub.resolves([fakeProject1]);
            context = new Context('frontend', 'get', '', []);
            receiver = new FrontendReceiver(context);
            sandbox.stub(receiver.git, 'clone').resolves('Download completed.');
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not download fakeproject: Fake error' }, color: 'red' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'get', '', ['--force']);
            receiver = new FrontendReceiver(context);
            sandbox.stub(helpers, 'eraseDirectories').resolves();
            sandbox.stub(helpers, 'downloadFromFTP').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: publish', () => {

        it('should create package.json if the current packageJsonConfig is empty', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            const createPackageJsonStub = sandbox.stub(receiver, 'createPackageJson').resolves();
            const loadPackageJsonStub = sandbox.stub(context, '_loadPackageJsonConfig').callsFake(() => {
                receiver.context.packageJsonConfig = { name: 'fakename' };
            });
            sandbox.stub(receiver.result, 'liveTextLine');
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('');
            sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves();
            receiver.context.packageJsonConfig = {};

            await receiver.publish();

            expect(createPackageJsonStub).to.have.been.calledOnce;
            expect(loadPackageJsonStub).to.have.been.calledOnce;
        });

        it('should print error if creating package.json failed', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            const createPackageJsonStub = sandbox.stub(receiver, 'createPackageJson').rejects();
            const loadPackageJsonStub = sandbox.stub(context, '_loadPackageJsonConfig');
            const printAlertStub = sandbox.stub(receiver.result, 'addAlert');
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('');
            sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves();
            receiver.context.packageJsonConfig = {};

            await receiver.publish();

            expect(createPackageJsonStub).to.have.been.calledOnce;
            expect(loadPackageJsonStub).to.not.have.been.called;
            expect(printAlertStub).to.have.been.calledWith('red');
        });

        it('should throw error if creating package.json aborted and packageJsonConfig is still empty', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            const createPackageJsonStub = sandbox.stub(receiver, 'createPackageJson').resolves();
            const loadPackageJsonStub = sandbox.stub(context, '_loadPackageJsonConfig');
            sandbox.stub(receiver.result, 'liveTextLine');
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('');
            sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves();
            receiver.context.packageJsonConfig = {};

            try {
                await receiver.publish();
            } catch (e) {
                expect(createPackageJsonStub).to.have.been.calledOnce;
                expect(loadPackageJsonStub).to.have.been.calledOnce;
                return;
            }

            chai.assert.fail('Should throw error when package.json still empty after creating');
        });

        it('should run tests and print success if -t | --test flag provided', async function () {

            context = new Context('frontend', 'publish', [], ['-t']);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('');
            sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves();

            receiver.context.packageJsonConfig = { name: 'fakename' };
            const runTestsStub = sandbox.stub(receiver, 'runTests').resolves('Success');
            const printAlertStub = sandbox.stub(receiver.result, 'addAlert');

            await receiver.publish();

            expect(runTestsStub).to.have.been.calledOnce;
            expect(printAlertStub).to.have.been.calledWith('green');
        });

        it('should run tests and print error if -t | --test flag provided', async function () {

            context = new Context('frontend', 'publish', [], ['-t']);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('');
            sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves();

            receiver.context.packageJsonConfig = { name: 'fakename' };
            const runTestsStub = sandbox.stub(receiver, 'runTests').rejects();
            const printAlertStub = sandbox.stub(receiver.result, 'addAlert');

            await receiver.publish();

            expect(runTestsStub).to.have.been.calledOnce;
            expect(printAlertStub).to.have.been.calledWith('red');
        });

        it('should call FtpPublishStrategy#publish() method if --ftp flag provided', async function () {

            context = new Context('frontend', 'publish', [], ['--ftp']);
            receiver = new FrontendReceiver(context);

            receiver.context.packageJsonConfig = { name: 'fakename' };

            const ftpPublishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves({ body: '{}' });

            await receiver.publish();

            expect(ftpPublishStub).to.have.been.calledOnce;
        });

        it('should call FtpPublishStrategy#publish() method if .mdb -> publishMethod set to ftp', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            receiver.context.packageJsonConfig = { name: 'fakename' };
            receiver.context.mdbConfig.mdbConfig.publishMethod = 'ftp';

            const ftpPublishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves({ body: '{}' });

            await receiver.publish();

            expect(ftpPublishStub).to.have.been.calledOnce;
        });

        it('should call PipelinePublishStrategy#publish() method if current git remote is git.mdbgo.com and user agreed', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            receiver.context.packageJsonConfig = { name: 'fakename' };
            receiver.context.mdbConfig.mdbConfig.publishMethod = '';
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('git.mdbgo.com');
            sandbox.stub(helpers, 'createConfirmationPrompt').resolves(true);

            const pipelinePublishStub = sandbox.stub(PipelinePublishStrategy.prototype, 'publish').resolves({ body: '{}' });

            await receiver.publish();

            expect(pipelinePublishStub).to.have.been.calledOnce;
        });

        it('should call PipelinePublishStrategy#publish() method if it is saved in config', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            receiver.context.packageJsonConfig = { name: 'fakename' };
            receiver.context.mdbConfig.mdbConfig.publishMethod = 'pipeline';

            const pipelinePublishStub = sandbox.stub(PipelinePublishStrategy.prototype, 'publish').resolves({ body: '{}' });

            await receiver.publish();

            expect(pipelinePublishStub).to.have.been.calledOnce;
        });

        it('should call FtpPublishStrategy#publish() method if current git remote is git.mdbgo.com but user did not agree', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            receiver.context.packageJsonConfig = { name: 'fakename' };
            receiver.context.mdbConfig.mdbConfig.publishMethod = '';
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('git.mdbgo.com');
            sandbox.stub(helpers, 'createConfirmationPrompt').resolves(false);

            const ftpPublishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves();

            await receiver.publish();

            expect(ftpPublishStub).to.have.been.calledOnce;
        });

        it('should call FtpPublishStrategy#publish() method as a default fallback', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            receiver.context.packageJsonConfig = { name: 'fakename' };
            receiver.context.mdbConfig.mdbConfig.publishMethod = '';
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('');

            const ftpPublishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves();

            await receiver.publish();

            expect(ftpPublishStub).to.have.been.calledOnce;
        });
    });

    describe('Method: delete', () => {

        const fakeProject = {
            projectId: 1,
            userNicename: 'fakeuser',
            projectName: 'fakeproject',
            domainName: null,
            publishDate: '2019-06-24T06:49:53.000Z',
            editDate: '2019-06-24T06:49:53.000Z',
            repoUrl: null,
            status: 'published',
            projectMeta: []
        };

        let getFrontendProjectsStub;

        beforeEach(() => {

            getFrontendProjectsStub = sandbox.stub(FrontendReceiver.prototype, 'getFrontendProjects');
        });

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getFrontendProjectsStub.resolves([]);
            context = new Context('frontend', 'delete', '', []);
            receiver = new FrontendReceiver(context);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'delete', '', ['-n', 'fakename']);
            receiver = new FrontendReceiver(context);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if the project was deleted', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Project successfully deleted.' }, color: 'green' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'delete', '', ['--name', 'fakeproject']);
            receiver = new FrontendReceiver(context);
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakeproject');
            sandbox.stub(receiver.http, 'delete').resolves({ body: 'Project successfully deleted.' });

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if user enters wrong project name', async () => {

            const expectedResult = { type: 'text', value: 'The names do not match.' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'delete', '', ['--name', 'fakeproject']);
            receiver = new FrontendReceiver(context);
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakename');

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not delete fakeproject: Fake error' }, color: 'red' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'delete', '', []);
            receiver = new FrontendReceiver(context);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakeproject');
            sandbox.stub(receiver.http, 'delete').rejects({ message: 'Fake error' });

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: rename', () => {

        const fakeName = 'fake-name';
        const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Project name successfully changed to fake-name' }, color: 'green' };

        let promptStub;

        beforeEach(() => {

            promptStub = sandbox.stub(helpers, 'createTextPrompt');
            sandbox.stub(helpers, 'serializeJsonFile').resolves();
            context = new Context('frontend', 'rename', '', []);
            sandbox.stub(context, '_loadPackageJsonConfig');
            sandbox.stub(context.mdbConfig, 'setValue');
            sandbox.stub(context.mdbConfig, 'save');
            receiver = new FrontendReceiver(context);
            sandbox.stub(receiver, 'clearResult');
        });

        it('should rename project and return expected result if name defined in package.json', async () => {

            receiver.context.packageJsonConfig = { name: 'old-name' };
            promptStub.resolves(fakeName);

            const result = await receiver.rename();

            expect(result).to.be.eq(true);
            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should rename project and return expected result if no package.json', async () => {

            receiver.context.packageJsonConfig = {};
            receiver.flags['new-name'] = fakeName;

            const result = await receiver.rename();

            expect(result).to.be.eq(true);
            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: getProjectName', () => {

        const fakeName = 'fake-name';

        it('should return project name if defined in package.json', () => {

            context = new Context('frontend', 'rename', '', []);
            receiver = new FrontendReceiver(context);
            sandbox.stub(receiver.context, 'packageJsonConfig').value({ name: fakeName });

            const projectName = receiver.getProjectName();

            expect(projectName).to.be.eq(fakeName);
        });

        it('should return project name if defined in config file', () => {

            context = new Context('frontend', 'rename', '', []);
            sandbox.stub(context.mdbConfig, 'getValue').returns(fakeName);
            receiver = new FrontendReceiver(context);
            sandbox.stub(receiver.context, 'packageJsonConfig').value({});

            const projectName = receiver.getProjectName();

            expect(projectName).to.be.eq(fakeName);
        });

        it('should return undefined if project name not defined', () => {

            context = new Context('frontend', 'rename', '', []);
            sandbox.stub(context.mdbConfig, 'getValue').returns(undefined);
            receiver = new FrontendReceiver(context);
            sandbox.stub(receiver.context, 'packageJsonConfig').value({});

            const projectName = receiver.getProjectName();

            expect(projectName).to.be.eq(undefined);
        });
    });
});
