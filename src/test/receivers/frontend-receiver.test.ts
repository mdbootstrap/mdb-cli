import fs from 'fs';
import clipboardy from 'clipboardy';
import config from '../../config';
import Context from '../../context';
import helpers from '../../helpers';
import { Project } from '../../models/project';
import FrontendReceiver from '../../receivers/frontend-receiver';
import { FtpPublishStrategy, PipelinePublishStrategy } from '../../receivers/strategies/publish';
import HttpWrapper, { CustomOkResponse, CustomErrorResponse } from '../../utils/http-wrapper';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Receiver: frontend', () => {

    const sandbox = createSandbox();

    let context: Context,
        receiver: FrontendReceiver;

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

            context = new Context('frontend', 'list', [], []);
            receiver = new FrontendReceiver(context);
            sandbox.stub(receiver.http, 'get').resolves({ body: '[]' } as CustomOkResponse);

            await receiver.list();

            expect(receiver.result.messages[0].value).to.eql('You don\'t have any projects yet.');
        });

        it('should set expected result if user has projects', async () => {

            const fakeProject1 = {
                projectId: 1,
                user: { userNicename: 'fakeuser1', userLogin: 'fakeuser-1' },
                projectName: 'fakeproject1',
                domainName: null,
                publishDate: '2019-06-24T06:49:53.000Z',
                editDate: '2019-06-24T06:49:53.000Z',
                repoUrl: null,
                status: 'published',
                projectMeta: [],
                collaborationRole: { name: 'owner' }
            };
            const fakeProject2 = {
                projectId: 2,
                user: { userNicename: 'fakeuser2', userLogin: 'fakeuser-2' },
                projectName: 'fakeproject2',
                domainName: 'fake.domain.name',
                publishDate: '2019-06-24T06:49:53.000Z',
                editDate: '2019-06-24T06:49:53.000Z',
                repoUrl: 'fake.repo.url',
                status: 'created',
                projectMeta: [{ metaKey: '_uploaded_to_ftp', metaValue: '0' }],
                collaborationRole: { name: 'owner' }
            };
            const expectedResult = [{
                'Project Name': 'fakeproject1',
                'Project URL': `https://fake.domain/fakeuser1/fakeproject1/`,
                'Published': new Date(fakeProject1.publishDate).toLocaleString(),
                'Edited': new Date(fakeProject1.editDate).toLocaleString(),
                'Repository': '-',
                'Role': 'owner'
            }, {
                'Project Name': 'fakeproject2',
                'Project URL': 'Unavailable',
                'Published': '-',
                'Edited': new Date(fakeProject1.editDate).toLocaleString(),
                'Repository': 'fake.repo.url',
                'Role': 'owner'
            }];
            sandbox.stub(FrontendReceiver.prototype, 'getFrontendProjects').resolves([fakeProject1 as Project, fakeProject2 as Project]);
            context = new Context('frontend', 'list', [], []);
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

        let createConfirmationPromptStub: SinonStub,
            createJenkinsfileStub: SinonStub,
            createListPromptStub: SinonStub,
            createTextPromptStub: SinonStub,
            downloadFromFTPStub: SinonStub,
            eraseDirectoriesStub: SinonStub,
            existsSyncStub: SinonStub,
            getStub: SinonStub;

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

        it('should print error if invalid variant provided', async function () {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Invalid starter code, correct options are fake-slug' }, color: 'red' };
            getStub.resolves({ body: JSON.stringify([fakeProduct]) });

            await receiver.init('invalid');

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: get', () => {

        const fakeProject = {
            projectId: 1,
            user: { userNicename: 'fakeuser' },
            projectName: 'fakeproject',
            domainName: null,
            publishDate: '2019-06-24T06:49:53.000Z',
            editDate: '2019-06-24T06:49:53.000Z',
            repoUrl: null,
            status: 'published',
            projectMeta: []
        };

        let getFrontendProjectsStub: SinonStub;

        beforeEach(() => {

            sandbox.stub(config, 'projectsDomain').value('fake.domain');
            getFrontendProjectsStub = sandbox.stub(FrontendReceiver.prototype, 'getFrontendProjects');
        });

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getFrontendProjectsStub.resolves([]);
            context = new Context('frontend', 'get', [], []);
            receiver = new FrontendReceiver(context);

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'get', [], ['-n', 'fakename']);
            receiver = new FrontendReceiver(context);

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is downloaded from ftp', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Download completed.' }, color: 'green' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'get', [], ['--name', 'fakeproject']);
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
            context = new Context('frontend', 'get', [], []);
            receiver = new FrontendReceiver(context);
            sandbox.stub(receiver.git, 'clone').resolves('Download completed.');
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not download fakeproject: Fake error' }, color: 'red' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'get', [], ['--force']);
            receiver = new FrontendReceiver(context);
            sandbox.stub(helpers, 'eraseDirectories').resolves();
            sandbox.stub(helpers, 'downloadFromFTP').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: publish', () => {

        let copyStub: SinonStub;
        const body = JSON.stringify({ message: '', url: '' });

        beforeEach(() => {
            sandbox.stub(fs, 'writeFileSync');
            copyStub = sandbox.stub(clipboardy, 'write');
        });

        it('should print error if failed to authorize user', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.context, 'authorizeUser').rejects('fakeErr');

            const alertStub = sandbox.stub(receiver.result, 'addAlert');

            await receiver.publish();

            expect(alertStub).to.have.been.calledWith('red');
        });

        it('should create package.json if the current packageJsonConfig is empty', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            const createPackageJsonStub = sandbox.stub(receiver, 'createPackageJson').resolves();
            const loadPackageJsonStub = sandbox.stub(context, '_loadPackageJsonConfig').callsFake(() => {
                receiver.context.packageJsonConfig = { name: 'fakename' };
            });

            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');
            sandbox.stub(receiver.result, 'liveTextLine');
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('');
            sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves({ body } as CustomOkResponse);
            receiver.context.packageJsonConfig = {};

            await receiver.publish();

            expect(createPackageJsonStub).to.have.been.calledOnce;
            expect(loadPackageJsonStub).to.have.been.calledOnce;
            sandbox.assert.calledOnce(copyStub);
        });

        it('should print error if creating package.json failed', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            const createPackageJsonStub = sandbox.stub(receiver, 'createPackageJson').rejects();
            const loadPackageJsonStub = sandbox.stub(context, '_loadPackageJsonConfig');
            const printAlertStub = sandbox.stub(receiver.result, 'addAlert');

            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('');
            sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves();
            receiver.context.packageJsonConfig = {};

            await receiver.publish();

            expect(createPackageJsonStub).to.have.been.calledOnce;
            expect(loadPackageJsonStub).to.not.have.been.called;
            expect(printAlertStub).to.have.been.calledWith('red');
            sandbox.assert.notCalled(copyStub);
        });

        it('should throw error if creating package.json aborted and packageJsonConfig is still empty', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            const createPackageJsonStub = sandbox.stub(receiver, 'createPackageJson').resolves();
            const loadPackageJsonStub = sandbox.stub(context, '_loadPackageJsonConfig');

            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');
            sandbox.stub(receiver.result, 'liveTextLine');
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('');
            sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves();
            receiver.context.packageJsonConfig = {};

            try {
                await receiver.publish();
            } catch (e) {
                expect(createPackageJsonStub).to.have.been.calledOnce;
                expect(loadPackageJsonStub).to.have.been.calledOnce;
                sandbox.assert.notCalled(copyStub);
                return;
            }

            chai.assert.fail('Should throw error when package.json still empty after creating');
        });

        it('should run tests and print success if -t | --test flag provided', async function () {

            context = new Context('frontend', 'publish', [], ['-t']);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('');
            sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves({ body } as CustomOkResponse);

            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');
            receiver.context.packageJsonConfig = { name: 'fakename' };
            const runTestsStub = sandbox.stub(receiver, 'runTests').resolves('Success');
            const printAlertStub = sandbox.stub(receiver.result, 'addAlert');

            await receiver.publish();

            expect(runTestsStub).to.have.been.calledOnce;
            expect(printAlertStub).to.have.been.calledWith('green');
            sandbox.assert.calledOnce(copyStub);
        });

        it('should run tests and print error if -t | --test flag provided', async function () {

            context = new Context('frontend', 'publish', [], ['-t']);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('');
            sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves();

            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');
            receiver.context.packageJsonConfig = { name: 'fakename' };
            const runTestsStub = sandbox.stub(receiver, 'runTests').rejects();
            const printAlertStub = sandbox.stub(receiver.result, 'addAlert');

            await receiver.publish();

            expect(runTestsStub).to.have.been.calledOnce;
            expect(printAlertStub).to.have.been.calledWith('red');
            sandbox.assert.notCalled(copyStub);
        });

        it('should call FtpPublishStrategy#publish() method if --ftp flag provided', async function () {

            context = new Context('frontend', 'publish', [], ['--ftp']);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');
            receiver.context.packageJsonConfig = { name: 'fakename' };

            const ftpPublishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves({ body } as CustomOkResponse);

            await receiver.publish();

            expect(ftpPublishStub).to.have.been.calledOnce;
            sandbox.assert.calledOnce(copyStub);
        });

        it('should call FtpPublishStrategy#publish() method if .mdb -> publishMethod set to ftp', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');
            receiver.context.packageJsonConfig = { name: 'fakename' };
            receiver.context.mdbConfig.mdbConfig.publishMethod = 'ftp';

            const ftpPublishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves({ body } as CustomOkResponse);

            await receiver.publish();

            expect(ftpPublishStub).to.have.been.calledOnce;
            sandbox.assert.calledOnce(copyStub);
        });

        it('should call FtpPublishStrategy#publish() method and show prompt if projectName conflict error', async function () {

            context = new Context('frontend', 'publish', [], ['--ftp']);
            receiver = new FrontendReceiver(context);
            receiver.context.packageJsonConfig = { name: 'fakename' };

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            const confirmPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt').resolves(false);
            const textPromptStub = sandbox.stub(helpers, 'createTextPrompt').resolves('fakeProjectName');
            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');
            sandbox.stub(receiver.context, 'setPackageJsonValue');
            sandbox.stub(receiver.context.mdbConfig, 'setValue');
            sandbox.stub(receiver.context.mdbConfig, 'save');

            const ftpPublishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish');
            ftpPublishStub.onFirstCall().rejects({ message: 'project name', statusCode: 409 } as CustomErrorResponse);
            ftpPublishStub.onSecondCall().resolves({ body } as CustomOkResponse);

            await receiver.publish();

            expect(ftpPublishStub).to.have.been.calledTwice;
            expect(confirmPromptStub).to.have.been.calledOnce;
            expect(textPromptStub).to.have.been.calledOnce;
            sandbox.assert.calledOnce(copyStub);
        });

        it('should call FtpPublishStrategy#publish() method and show prompt if domain conflict error', async function () {

            context = new Context('frontend', 'publish', [], ['--ftp']);
            receiver = new FrontendReceiver(context);
            receiver.context.packageJsonConfig = { name: 'fakename' };

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            const textPromptStub = sandbox.stub(helpers, 'createTextPrompt').resolves('fake.domain');
            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');
            sandbox.stub(receiver.context.mdbConfig, 'setValue');
            sandbox.stub(receiver.context.mdbConfig, 'save');

            const ftpPublishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish');
            ftpPublishStub.onFirstCall().rejects({ message: 'domain name', statusCode: 409 } as CustomErrorResponse);
            ftpPublishStub.onSecondCall().resolves({ body } as CustomOkResponse);

            await receiver.publish();

            expect(ftpPublishStub).to.have.been.calledTwice;
            expect(textPromptStub).to.have.been.calledOnce;
            sandbox.assert.calledOnce(copyStub);
        });

        it('should call PipelinePublishStrategy#publish() method if current git remote is git.mdbgo.com and user agreed', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            receiver.context.packageJsonConfig = { name: 'fakename' };
            receiver.context.mdbConfig.mdbConfig.publishMethod = undefined;
            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('git.mdbgo.com');
            sandbox.stub(helpers, 'createConfirmationPrompt').resolves(true);

            const pipelinePublishStub = sandbox.stub(PipelinePublishStrategy.prototype, 'publish').resolves({ body } as CustomOkResponse);

            await receiver.publish();

            expect(pipelinePublishStub).to.have.been.calledOnce;
            sandbox.assert.calledOnce(copyStub);
        });

        it('should call PipelinePublishStrategy#publish() method if it is saved in config', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            sandbox.stub(receiver.context.mdbConfig, 'getValue')
                .withArgs('hash').returns('fakehash')
                .withArgs('publishMethod').returns('pipeline');
            receiver.context.packageJsonConfig = { name: 'fakename' };

            const pipelinePublishStub = sandbox.stub(PipelinePublishStrategy.prototype, 'publish').resolves({ body } as CustomOkResponse);

            await receiver.publish();

            expect(pipelinePublishStub).to.have.been.calledOnce;
            sandbox.assert.calledOnce(copyStub);
        });

        it('should call FtpPublishStrategy#publish() method if current git remote is git.mdbgo.com but user did not agree', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            receiver.context.packageJsonConfig = { name: 'fakename' };
            receiver.context.mdbConfig.mdbConfig.publishMethod = undefined;
            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('git.mdbgo.com');
            sandbox.stub(helpers, 'createConfirmationPrompt').resolves(false);

            const ftpPublishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves();

            await receiver.publish();

            expect(ftpPublishStub).to.have.been.calledOnce;
            sandbox.assert.notCalled(copyStub);
        });

        it('should call FtpPublishStrategy#publish() method as a default fallback', async function () {

            context = new Context('frontend', 'publish', [], []);
            receiver = new FrontendReceiver(context);

            sandbox.stub(receiver.context, 'authorizeUser').resolves();
            receiver.context.packageJsonConfig = { name: 'fakename' };
            receiver.context.mdbConfig.mdbConfig.publishMethod = undefined;
            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');
            sandbox.stub(receiver.git, 'getCurrentRemoteUrl').returns('');

            const ftpPublishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves({ body } as CustomOkResponse);

            await receiver.publish();

            expect(ftpPublishStub).to.have.been.calledOnce;
            sandbox.assert.calledOnce(copyStub);
        });
    });

    describe('Method: delete', () => {

        const fakeProject = {
            projectId: 1,
            user: { userNicename: 'fakeuser' },
            projectName: 'fakeproject',
            domainName: null,
            publishDate: '2019-06-24T06:49:53.000Z',
            editDate: '2019-06-24T06:49:53.000Z',
            repoUrl: null,
            status: 'published',
            projectMeta: []
        };

        let getFrontendProjectsStub: SinonStub;

        beforeEach(() => {

            getFrontendProjectsStub = sandbox.stub(FrontendReceiver.prototype, 'getFrontendProjects');
        });

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getFrontendProjectsStub.resolves([]);
            context = new Context('frontend', 'delete', [], []);
            receiver = new FrontendReceiver(context);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'delete', [], ['-n', 'fakename']);
            receiver = new FrontendReceiver(context);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if the project was deleted', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Project successfully deleted.' }, color: 'green' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'delete', [], ['--name', 'fakeproject']);
            receiver = new FrontendReceiver(context);
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakeproject');
            sandbox.stub(receiver.http, 'delete').resolves({ body: 'Project successfully deleted.' } as CustomOkResponse);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if user enters wrong project name', async () => {

            const expectedResult = { type: 'text', value: 'The names do not match.' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'delete', [], ['--name', 'fakeproject']);
            receiver = new FrontendReceiver(context);
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakename');

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not delete fakeproject: Fake error' }, color: 'red' };
            getFrontendProjectsStub.resolves([fakeProject]);
            context = new Context('frontend', 'delete', [], []);
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

        let promptStub: SinonStub;

        beforeEach(() => {

            promptStub = sandbox.stub(helpers, 'createTextPrompt');
            sandbox.stub(helpers, 'serializeJsonFile').resolves();
            context = new Context('frontend', 'rename', [], []);
            sandbox.stub(context.mdbConfig, 'setValue');
            sandbox.stub(context.mdbConfig, 'save');
            receiver = new FrontendReceiver(context);
        });

        it('should rename project and return expected result if name defined in package.json', async () => {

            sandbox.stub(receiver.http, 'post').resolves({ body: JSON.stringify({ message: 'Fake message' }) } as CustomOkResponse);
            receiver.context.packageJsonConfig = { name: 'old-name' };
            promptStub.resolves(fakeName);

            await receiver.rename();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should rename project and return expected result if no package.json', async () => {

            sandbox.stub(receiver.http, 'post').resolves({ body: JSON.stringify({ message: 'Fake message' }) } as CustomOkResponse);
            receiver.context.packageJsonConfig = {};
            receiver.flags['new-name'] = fakeName;

            await receiver.rename();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should return expected result if error', async () => {

            const expectedRes = { type: 'alert', value: { title: 'Error', body: 'Could not rename old-name: Fake error message' }, color: 'red' };
            sandbox.stub(receiver.http, 'post').rejects({ message: 'Fake error message' });
            receiver.context.packageJsonConfig = { name: 'old-name' };
            receiver.flags['new-name'] = fakeName;

            await receiver.rename();

            expect(receiver.result.messages).to.deep.include(expectedRes);
        });
    });

    describe('Method: getProjectName', () => {

        const fakeName = 'fake-name';

        it('should return project name if defined in package.json', () => {

            context = new Context('frontend', 'rename', [], []);
            receiver = new FrontendReceiver(context);
            sandbox.stub(receiver.context, 'packageJsonConfig').value({ name: fakeName });

            const projectName = receiver.getProjectName();

            expect(projectName).to.be.eq(fakeName);
        });

        it('should return project name if defined in config file', () => {

            context = new Context('frontend', 'rename', [], []);
            sandbox.stub(context.mdbConfig, 'getValue').returns(fakeName);
            receiver = new FrontendReceiver(context);
            sandbox.stub(receiver.context, 'packageJsonConfig').value({});

            const projectName = receiver.getProjectName();

            expect(projectName).to.be.eq(fakeName);
        });

        it('should return undefined if project name not defined', () => {

            context = new Context('frontend', 'rename', [], []);
            sandbox.stub(context.mdbConfig, 'getValue').returns(undefined);
            receiver = new FrontendReceiver(context);
            sandbox.stub(receiver.context, 'packageJsonConfig').value({});

            const projectName = receiver.getProjectName();

            expect(projectName).to.be.eq(undefined);
        });
    });

    describe('Method: deleteMany', () => {

        const fakeProject = {
            projectId: 1,
            user: { userNicename: 'fakeuser' },
            projectName: 'fakeproject',
            domainName: null,
            publishDate: '2019-06-24T06:49:53.000Z',
            editDate: '2019-06-24T06:49:53.000Z',
            repoUrl: null,
            status: 'published',
            projectMeta: []
        };

        let getStub: SinonStub,
            deleteStub: SinonStub,
            createPassPromptStub: SinonStub,
            createCheckboxPromptStub: SinonStub,
            createConfirmationPromptStub: SinonStub;

        beforeEach(() => {

            getStub = sandbox.stub(HttpWrapper.prototype, 'get');
            deleteStub = sandbox.stub(HttpWrapper.prototype, 'delete');
            createPassPromptStub = sandbox.stub(helpers, 'createPassPrompt');
            createCheckboxPromptStub = sandbox.stub(helpers, 'createCheckboxPrompt');
            createConfirmationPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt');
        });

        it('should delete projects and return expected result', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Project fakeproject successfully deleted.' }, color: 'green' };
            getStub.resolves({ body: JSON.stringify([fakeProject]) });
            createPassPromptStub.resolves('fakePass');
            deleteStub.resolves();
            context = new Context('frontend', 'delete', ['fakeproject'], []);
            receiver = new FrontendReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should delete all user databases and return expected result', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Project fakeproject successfully deleted.' }, color: 'green' };
            getStub.resolves({ body: JSON.stringify([fakeProject]) });
            createConfirmationPromptStub.resolves(true);
            createPassPromptStub.resolves('fakePwd');
            deleteStub.resolves();
            context = new Context('frontend', 'delete', [], ['--all']);
            receiver = new FrontendReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should delete user databases with --many flag and return expected result', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Project fakeproject successfully deleted.' }, color: 'green' };
            getStub.resolves({ body: JSON.stringify([fakeProject]) });
            createCheckboxPromptStub.resolves(['fakeproject']);
            createPassPromptStub.resolves('fakePwd');
            deleteStub.resolves();
            context = new Context('frontend', 'delete', [], ['--many']);
            receiver = new FrontendReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should delete all user databases with --force and --password flags and return expected result', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Project fakeproject successfully deleted.' }, color: 'green' };
            getStub.resolves({ body: JSON.stringify([fakeProject]) });
            deleteStub.resolves();
            context = new Context('frontend', 'delete', [], ['--all', '--force', '--password', 'fakePwd']);
            receiver = new FrontendReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should return expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getStub.resolves({ body: '[]' });
            context = new Context('frontend', 'delete', [], []);
            receiver = new FrontendReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should return expected result if project not found', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Project fakename not found.' }, color: 'red' };
            getStub.resolves({ body: JSON.stringify([fakeProject]) });
            context = new Context('frontend', 'delete', ['fakename'], []);
            receiver = new FrontendReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should return expected result if project name not provided', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Project names not provided.' }, color: 'red' };
            getStub.resolves({ body: JSON.stringify([fakeProject]) });
            context = new Context('frontend', 'delete', [], []);
            receiver = new FrontendReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should return expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not delete: Fake error' }, color: 'red' };
            getStub.resolves({ body: JSON.stringify([fakeProject]) });
            deleteStub.rejects({ message: 'Fake error' });
            createPassPromptStub.resolves('fakePwd');
            context = new Context('frontend', 'delete', ['fakeproject'], []);
            receiver = new FrontendReceiver(context);

            await receiver.deleteMany();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });
});
