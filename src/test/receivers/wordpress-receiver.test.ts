import open from 'open';
import config from '../../config';
import Context from '../../context';
import helpers from '../../helpers';
import WordpressReceiver, { WpCredentials, CreateWpPayload } from '../../receivers/wordpress-receiver';
import FtpPublishStrategy from '../../receivers/strategies/publish/ftp-publish-strategy';
import HttpWrapper, { CustomOkResponse, CustomErrorResponse } from '../../utils/http-wrapper';
import { ProjectStatus } from '../../models/project-status';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Receiver: wordpress', () => {

    const sandbox = createSandbox();

    const fakeProject = {
        projectId: 1,
        user: { userNicename: 'fakeuser' },
        projectName: 'fakeproject',
        domainName: null,
        publishDate: '2019-06-24T06:49:53.000Z',
        editDate: '2019-06-24T06:49:53.000Z',
        repoUrl: null,
        status: ProjectStatus.WORDPRESS,
        projectMeta: [{ metaKey: '_backend_technology', metaValue: 'faketechnology' }]
    };

    const fakeStarter = [{
        available: true,
        category: 'fakeCategory',
        license: 'fakeLicense',
        displayName: 'fakeName',
        code: 'fakeVariant',
        type: 'wordpress',
    }];

    let context: Context,
        receiver: WordpressReceiver,
        getWordpressProjectsStub: SinonStub;

    beforeEach(() => {

        sandbox.stub(config, 'projectsDomain').value('http://fake.domain');
        sandbox.stub(Context.prototype, 'authenticateUser');
        sandbox.stub(WordpressReceiver.prototype, '_getWordpressStartersOptions').resolves(fakeStarter);
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: list', () => {

        it('should set expected result if user does not have any projects', async () => {

            context = new Context('wordpress', '', [], []);
            receiver = new WordpressReceiver(context);
            sandbox.stub(receiver.http, 'get').resolves({ body: '[]' } as CustomOkResponse);

            await receiver.list();

            expect(receiver.result.messages[0].value).to.eql('You don\'t have any projects yet.');
        });

        it('should set expected result if user has projects', async () => {

            const fakeProject1 = {
                projectId: 1,
                user: { userNicename: 'fakeuser1' },
                projectName: 'fakeproject1',
                domainName: null,
                publishDate: '2019-06-24T06:49:53.000Z',
                editDate: '2019-06-24T06:49:53.000Z',
                repoUrl: null,
                status: 'wordpress',
                projectMeta: [{ metaKey: '_backend_technology', metaValue: 'faketechnology1' }, { metaKey: '_container_port', metaValue: '12345' }],
                role: { name: 'owner' }
            };
            const fakeProject2 = {
                projectId: 2,
                user: { userNicename: 'fakeuser2' },
                projectName: 'fakeproject2',
                domainName: null,
                publishDate: '2019-06-24T06:49:53.000Z',
                editDate: '2019-06-24T06:49:53.000Z',
                repoUrl: 'fake.repo.url',
                status: 'wordpress',
                projectMeta: [],
                role: { name: 'owner' }
            };
            const expectedResult = [{
                'Project Name': 'fakeproject1',
                'Published': new Date(fakeProject1.publishDate).toLocaleString(),
                'Edited': new Date(fakeProject1.editDate).toLocaleString(),
                'Technology': 'faketechnology1',
                'Repository': '-',
                'URL': 'http://fake.domain:12345',
                'Role': 'owner'
            }, {
                'Project Name': 'fakeproject2',
                'Published': new Date(fakeProject2.publishDate).toLocaleString(),
                'Edited': new Date(fakeProject2.editDate).toLocaleString(),
                'Technology': undefined,
                'Repository': 'fake.repo.url',
                'URL': 'Unavailable',
                'Role': 'owner'
            }];
            context = new Context('wordpress', '', [], []);
            receiver = new WordpressReceiver(context);
            sandbox.stub(receiver.http, 'get').resolves({ body: JSON.stringify([fakeProject1, fakeProject2]) } as CustomOkResponse);

            await receiver.list();

            expect(receiver.result.messages[0].value).to.eql(expectedResult);
        });
    });

    describe('Method: get', () => {

        beforeEach(() => {

            getWordpressProjectsStub = sandbox.stub(WordpressReceiver.prototype, 'getWordpressProjects');
        });

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getWordpressProjectsStub.resolves([]);
            context = new Context('wordpress', 'get', [], []);
            receiver = new WordpressReceiver(context);

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'get', [], ['-n', 'fakename']);
            receiver = new WordpressReceiver(context);

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is downloaded from ftp', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Download completed.' }, color: 'green' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'get', [], ['--name', 'fakeproject']);
            receiver = new WordpressReceiver(context);
            sandbox.stub(helpers, 'eraseDirectories').resolves();
            sandbox.stub(helpers, 'downloadFromFTP').resolves('Download completed.');

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is downloaded using git', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Download completed.' }, color: 'green' };
            const fakeProject1 = { ...fakeProject, ...{ repoUrl: 'fake.url' } };
            getWordpressProjectsStub.resolves([fakeProject1]);
            context = new Context('wordpress', 'get', [], []);
            receiver = new WordpressReceiver(context);
            sandbox.stub(receiver.git, 'clone').resolves('Download completed.');
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not download fakeproject: Fake error' }, color: 'red' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'get', [], ['--force']);
            receiver = new WordpressReceiver(context);
            sandbox.stub(helpers, 'eraseDirectories').resolves();
            sandbox.stub(helpers, 'downloadFromFTP').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: delete', () => {

        beforeEach(() => {

            getWordpressProjectsStub = sandbox.stub(WordpressReceiver.prototype, 'getWordpressProjects');
        });

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getWordpressProjectsStub.resolves([]);
            context = new Context('wordpress', 'delete', [], []);
            receiver = new WordpressReceiver(context);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'delete', [], ['-n', 'fakename']);
            receiver = new WordpressReceiver(context);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if the project was deleted', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Project successfully deleted.' }, color: 'green' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'delete', [], ['--name', 'fakeproject', '--ftp-only']);
            receiver = new WordpressReceiver(context);
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakeproject');
            sandbox.stub(receiver.http, 'delete').resolves({ body: 'Project successfully deleted.' } as CustomOkResponse);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if user enters wrong project name', async () => {

            const expectedResult = { type: 'text', value: 'The names do not match.' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'delete', [], ['--name', 'fakeproject']);
            receiver = new WordpressReceiver(context);
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakename');

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not delete fakeproject: Fake error' }, color: 'red' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'delete', [], []);
            receiver = new WordpressReceiver(context);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakeproject');
            sandbox.stub(receiver.http, 'delete').rejects({ message: 'Fake error' });

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: init', function () {

        it('should abort initialization if not in wp-content/themes and user aborts', async function () {

            context = new Context('wordpress', 'init', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(process, 'cwd').returns('/fake/path/tra/la/la');
            sandbox.stub(helpers, 'createConfirmationPrompt').resolves(false);
            sandbox.stub(receiver.result, 'addAlert');
            sandbox.stub(receiver.result, 'addTextLine');

            const listPromptStub = sandbox.stub(helpers, 'createListPrompt').resolves();
            const downloadStub = sandbox.stub(helpers, 'downloadFromFTP').resolves();

            await receiver.init();

            expect(listPromptStub).to.not.have.been.called;
            expect(downloadStub).to.not.have.been.called;
        });

        it('should continue initialization if not in wp-content/themes but user does not abort', async function () {

            context = new Context('wordpress', 'init', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(process, 'cwd').returns('/fake/path/tra/la/la');
            sandbox.stub(helpers, 'createConfirmationPrompt').resolves(true);
            sandbox.stub(receiver.result, 'addAlert');
            sandbox.stub(receiver.result, 'addTextLine');
            sandbox.stub(context.mdbConfig, 'save');

            const listPromptStub = sandbox.stub(helpers, 'createListPrompt').resolves('fakeVariant');
            const downloadStub = sandbox.stub(helpers, 'downloadFromFTP').resolves();

            await receiver.init();

            expect(listPromptStub).to.have.been.called;
            expect(downloadStub).to.have.been.called;
        });

        it('should print error if invalid variant provided', async function () {

            context = new Context('wordpress', 'init', [], ['--variant', 'invalid']);
            receiver = new WordpressReceiver(context);

            sandbox.stub(process, 'cwd').returns('/wp-content/themes');
            sandbox.stub(receiver.result, 'addTextLine');
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeVariant');

            const alertStub = sandbox.stub(receiver.result, 'addAlert');

            await receiver.init();

            expect(alertStub).to.have.been.called;
        });

        it('should create list prompt if no variant provided', async function () {

            context = new Context('wordpress', 'init', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(process, 'cwd').returns('/wp-content/themes');
            sandbox.stub(helpers, 'downloadFromFTP').resolves();
            sandbox.stub(context.mdbConfig, 'save');

            const listPromptStub = sandbox.stub(helpers, 'createListPrompt').resolves('fakeVariant');

            await receiver.init();

            expect(listPromptStub).to.have.been.called;
        });

        it('should download wp theme and update .mdb', async function () {

            context = new Context('wordpress', 'init', [], []);
            context.userToken = 'asdf.eyJ1c2VyU3Vic2NyaXB0aW9uU3RhdHVzIjoiRlJFRSJ9.asdf';
            receiver = new WordpressReceiver(context);

            sandbox.stub(process, 'cwd').returns('/wp-content/themes');
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeVariant');
            sandbox.stub(helpers, 'getThemeName').returns('fakeThemeName');

            const downloadStub = sandbox.stub(helpers, 'downloadFromFTP').resolves();
            const setValueStub = sandbox.stub(context.mdbConfig, 'setValue');
            const saveStub = sandbox.stub(context.mdbConfig, 'save');
            const alertStub = sandbox.stub(receiver.result, 'addAlert');

            await receiver.init();

            expect(downloadStub).to.have.been.called;
            expect(setValueStub.getCall(0).args).to.deep.eq(['meta.starter', 'fakeVariant']);
            expect(setValueStub.getCall(1).args).to.deep.eq(['meta.type', 'wordpress']);
            expect(saveStub).to.have.been.calledWith('fakeThemeName');
            expect(alertStub).to.have.been.calledWith('green');
        });

        it('should print error if download fails', async function () {

            context = new Context('wordpress', 'init', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(process, 'cwd').returns('/wp-content/themes');
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeVariant');

            const downloadStub = sandbox.stub(helpers, 'downloadFromFTP').rejects();
            const alertStub = sandbox.stub(receiver.result, 'addAlert');

            await receiver.init();

            expect(downloadStub).to.have.been.called;
            expect(alertStub).to.have.been.calledWith('red');
        });
    });

    describe('Method: publish', function () {

        it('should ask for page variant if not saved in .mdb and save it in .mdb', async function () {

            context = new Context('wordpress', 'publish', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(context.mdbConfig, 'getValue')
                .withArgs('meta.starter').returns(undefined)
                .withArgs('hash').returns('fakehash');
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeVariant');

            const setValueStub = sandbox.stub(context.mdbConfig, 'setValue');
            const saveStub = sandbox.stub(context.mdbConfig, 'save');

            await receiver._getPageVariant();

            expect(setValueStub.getCall(0).args).to.deep.eq(['meta.starter', 'fakeVariant']);
            expect(setValueStub.getCall(1).args).to.deep.eq(['meta.type', 'wordpress']);
            expect(saveStub).to.have.been.calledOnce;
        });

        it('should not ask for page variant if saved in .mdb', async function () {

            context = new Context('wordpress', 'publish', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(context.mdbConfig, 'getValue')
                .withArgs('meta.starter').returns('fakeStarter')
                .withArgs('hash').returns('fakehash');
            const promptStub = sandbox.stub(helpers, 'createListPrompt').resolves('fakeVariant');

            await receiver._getPageVariant();

            expect(promptStub).to.not.have.been.called;
        });

        it('should ask for simple credentials if projectName not in .mdb and update .mdb', async function () {

            context = new Context('wordpress', 'publish', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(context.mdbConfig, 'getValue')
                .withArgs('projectName').returns(undefined)
                .withArgs('hash').returns('fakehash');
            const askStub = sandbox.stub(receiver, 'askWpCredentials').resolves({ pageName: 'fakeProjectName', email: 'fakeEmail', username: 'fakeUsername' });
            const setValueStub = sandbox.stub(context.mdbConfig, 'setValue');
            const saveStub = sandbox.stub(context.mdbConfig, 'save');

            await receiver._getWpData();

            expect(askStub).to.have.been.calledWith(undefined);
            expect(setValueStub.getCall(0).args).to.deep.eq(['projectName', 'fakeprojectname']);
            expect(setValueStub.getCall(1).args).to.deep.eq(['wordpress.email', 'fakeEmail']);
            expect(setValueStub.getCall(2).args).to.deep.eq(['wordpress.username', 'fakeUsername']);
            expect(saveStub).to.have.been.calledOnce;
        });

        it('should ask for advanced credentials if projectName not in .mdb and update .mdb', async function () {

            context = new Context('wordpress', 'publish', [], ['--advanced']);
            receiver = new WordpressReceiver(context);

            sandbox.stub(context.mdbConfig, 'getValue')
                .withArgs('projectName').returns(undefined)
                .withArgs('hash').returns('fakehash');
            const askStub = sandbox.stub(receiver, 'askWpCredentials').resolves({ pageName: 'fakeProjectName', email: 'fakeEmail', username: 'fakeUsername' });
            const setValueStub = sandbox.stub(context.mdbConfig, 'setValue');
            const saveStub = sandbox.stub(context.mdbConfig, 'save');

            await receiver._getWpData();

            expect(askStub).to.have.been.calledWith(true);
            expect(setValueStub.getCall(0).args).to.deep.eq(['projectName', 'fakeprojectname']);
            expect(setValueStub.getCall(1).args).to.deep.eq(['wordpress.email', 'fakeEmail']);
            expect(setValueStub.getCall(2).args).to.deep.eq(['wordpress.username', 'fakeUsername']);
            expect(saveStub).to.have.been.calledOnce;
        });

        it('should use FtpPublishStrategy to upload files and call API to initialize WP if 201 returned', async function () {

            context = new Context('wordpress', 'publish', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(receiver, '_getPageVariant').resolves('fakeVariant');
            sandbox.stub(receiver, '_getWpData').resolves({ password: 'fake', repeatPassword: 'fake' } as WpCredentials);
            sandbox.stub(context.mdbConfig, 'getValue')
                .withArgs('projectName').returns('fakeName')
                .withArgs('wordpress.email').resolves('fakeEmail')
                .withArgs('wordpress.username').resolves('fakeUsername')
                .withArgs('publishMethod').resolves('ftp')
                .withArgs('hash').returns('fakehash');

            const publishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves({ statusCode: 201 } as CustomOkResponse);
            const createStub = sandbox.stub(receiver, '_createWpPage').resolves();

            await receiver.publish();

            expect(publishStub).to.have.been.calledOnce;
            expect(createStub).to.have.been.calledOnce;
        });

        it('should use FtpPublishStrategy to upload files and show prompt if projectName conflict error', async function () {

            context = new Context('wordpress', 'publish', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(receiver, '_getPageVariant').resolves('fakeVariant');
            sandbox.stub(receiver, '_getWpData').resolves({ password: 'fake', repeatPassword: 'fake' } as WpCredentials);
            sandbox.stub(context.mdbConfig, 'getValue')
                .withArgs('projectName').returns('fakeName')
                .withArgs('wordpress.email').resolves('fakeEmail')
                .withArgs('wordpress.username').resolves('fakeUsername')
                .withArgs('publishMethod').resolves('ftp')
                .withArgs('hash').returns('fakehash');
            sandbox.stub(receiver.context.mdbConfig, 'setValue');
            sandbox.stub(receiver.context.mdbConfig, 'save');

            const textPromptStub = sandbox.stub(helpers, 'createTextPrompt').resolves('fakeProjectName');
            const publishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves({ statusCode: 201 } as CustomOkResponse);
            const createStub = sandbox.stub(receiver, '_createWpPage');
            createStub.onFirstCall().rejects({ statusCode: 409, message: 'project name' } as CustomErrorResponse);
            createStub.onSecondCall().resolves();

            await receiver.publish();

            expect(createStub).to.have.been.calledTwice;
            expect(publishStub).to.have.been.calledTwice;
            expect(textPromptStub).to.have.been.calledOnce;
        });

        it('should use FtpPublishStrategy to upload files and show prompt if domain conflict error', async function () {

            context = new Context('wordpress', 'publish', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(receiver, '_getPageVariant').resolves('fakeVariant');
            sandbox.stub(receiver, '_getWpData').resolves({ password: 'fake', repeatPassword: 'fake' } as WpCredentials);
            sandbox.stub(context.mdbConfig, 'getValue')
                .withArgs('projectName').returns('fakeName')
                .withArgs('wordpress.email').resolves('fakeEmail')
                .withArgs('wordpress.username').resolves('fakeUsername')
                .withArgs('publishMethod').resolves('ftp')
                .withArgs('hash').returns('fakehash');
            sandbox.stub(receiver.context.mdbConfig, 'setValue');
            sandbox.stub(receiver.context.mdbConfig, 'save');

            const textPromptStub = sandbox.stub(helpers, 'createTextPrompt').resolves('fake.domain');
            const publishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves({ statusCode: 201 } as CustomOkResponse);
            const createStub = sandbox.stub(receiver, '_createWpPage');
            createStub.onFirstCall().rejects({ statusCode: 409, message: 'domain name' } as CustomErrorResponse);
            createStub.onSecondCall().resolves();

            await receiver.publish();

            expect(createStub).to.have.been.calledTwice;
            expect(publishStub).to.have.been.calledTwice;
            expect(textPromptStub).to.have.been.calledOnce;
        });

        it('should use FtpPublishStrategy to upload files and not call API if 200 returned', async function () {

            context = new Context('wordpress', 'publish', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(receiver, '_getPageVariant').resolves('fakeVariant');
            sandbox.stub(receiver, '_getWpData').resolves({ password: 'fake', repeatPassword: 'fake' } as WpCredentials);
            sandbox.stub(context.mdbConfig, 'getValue')
                .withArgs('projectName').returns('fakeName')
                .withArgs('wordpress.email').resolves('fakeEmail')
                .withArgs('wordpress.username').resolves('fakeUsername')
                .withArgs('hash').returns('fakehash');

            const publishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish').resolves({ statusCode: 200 } as CustomOkResponse);
            const createStub = sandbox.stub(receiver, '_createWpPage').resolves();

            await receiver.publish();

            expect(publishStub).to.have.been.calledOnce;
            expect(createStub).to.not.have.been.called;
        });

        it('should open browser if --open flag provided and print result', async function () {

            const fakePayload = { username: 'fake' };

            context = new Context('wordpress', 'publish', [], ['--open']);
            receiver = new WordpressReceiver(context);

            sandbox.stub(receiver.http, 'post').resolves({ body: JSON.stringify({ message: 'fake', url: 'fakeUrl', password: 'fake' }) } as CustomOkResponse);
            sandbox.stub(context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');

            // @ts-ignore
            const openStub = sandbox.stub(open, 'call');
            const alertStub = sandbox.stub(receiver.result, 'addAlert');
            const textStub = sandbox.stub(receiver.result, 'addTextLine');

            await receiver._createWpPage(fakePayload as CreateWpPayload);

            expect(openStub).to.have.been.calledOnce;
            expect(alertStub).to.have.been.calledWith('green');
            expect(textStub).to.have.been.calledWith(sandbox.match('fakeUrl'));
        });

        it('should print error if failed to publish', async function () {

            context = new Context('wordpress', 'publish', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(receiver, '_getPageVariant').resolves('fakeVariant');
            sandbox.stub(receiver, '_getWpData').resolves({ password: 'fake', repeatPassword: 'fake' } as WpCredentials);
            sandbox.stub(context.mdbConfig, 'getValue')
                .withArgs('projectName').returns('fakeName')
                .withArgs('wordpress.email').resolves('fakeEmail')
                .withArgs('wordpress.username').resolves('fakeUsername')
                .withArgs('hash').returns('fakehash');

            sandbox.stub(FtpPublishStrategy.prototype, 'publish').rejects(new Error('fake error'));

            const alertStub = sandbox.stub(receiver.result, 'addAlert');

            await receiver.publish();

            expect(alertStub).to.have.been.calledWith('red');
        });

        it('should print error if failed to call API', async function () {

            const fakePayload = { username: 'fake' };

            context = new Context('wordpress', 'publish', [], []);
            receiver = new WordpressReceiver(context);

            sandbox.stub(receiver.http, 'post').rejects(new Error('fake error'));
            sandbox.stub(context.mdbConfig, 'getValue').withArgs('hash').returns('fakehash');

            const alertStub = sandbox.stub(receiver.result, 'addAlert');

            await receiver._createWpPage(fakePayload as CreateWpPayload);

            expect(alertStub).to.have.been.calledWith('red');
        });
    });

    describe('Method: kill', () => {

        beforeEach(() => {

            getWordpressProjectsStub = sandbox.stub(WordpressReceiver.prototype, 'getWordpressProjects');
        });

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getWordpressProjectsStub.resolves([]);
            context = new Context('wordpress', 'kill', [], []);
            receiver = new WordpressReceiver(context);

            await receiver.kill();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'kill', [], ['-n', 'fakename']);
            receiver = new WordpressReceiver(context);

            await receiver.kill();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is killed', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Success.' }, color: 'green' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'kill', [], []);
            receiver = new WordpressReceiver(context);
            sandbox.stub(receiver.http, 'delete').resolves({ body: 'Success.' } as CustomOkResponse);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.kill();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not kill fakeproject: Fake error' }, color: 'red' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'kill', [], ['--remove']);
            receiver = new WordpressReceiver(context);
            sandbox.stub(receiver.http, 'delete').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.kill();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: info', () => {

        beforeEach(() => {

            getWordpressProjectsStub = sandbox.stub(WordpressReceiver.prototype, 'getWordpressProjects');
        });

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getWordpressProjectsStub.resolves([]);
            context = new Context('wordpress', 'info', [], []);
            receiver = new WordpressReceiver(context);

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'info', [], ['-n', 'fakename']);
            receiver = new WordpressReceiver(context);

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is running', async () => {

            const expectedResult = [
                { type: 'alert', value: { title: 'Status:', body: 'running' }, color: 'turquoise' },
                { type: 'alert', value: { title: 'Started at:', body: '2021-01-11 11:11:11' }, color: 'turquoise' },
                { type: 'alert', value: { title: 'App URL:', body: 'http://fake.domain:1234' }, color: 'turquoise' }
            ];
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'info', [], ['--name', 'fakeproject']);
            receiver = new WordpressReceiver(context);
            const result = { startedAt: '2021-01-11 11:11:11', killedAt: undefined, isUp: true, url: 'http://fake.domain:1234' };
            sandbox.stub(receiver.http, 'get').resolves({ body: JSON.stringify(result) } as CustomOkResponse);

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult[0]);
            expect(receiver.result.messages).to.deep.include(expectedResult[1]);
            expect(receiver.result.messages).to.deep.include(expectedResult[2]);
        });

        it('should set expected result if project is not running', async () => {

            const expectedResult = [
                { type: 'alert', value: { title: 'Status:', body: 'dead' }, color: 'turquoise' },
                { type: 'alert', value: { title: 'Killed at:', body: '2021-01-11 11:11:11' }, color: 'turquoise' }
            ];
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'info', [], []);
            receiver = new WordpressReceiver(context);
            const result = { startedAt: undefined, killedAt: '2021-01-11 11:11:11', port: undefined };
            sandbox.stub(receiver.http, 'get').resolves({ body: JSON.stringify(result) } as CustomOkResponse);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult[0]);
            expect(receiver.result.messages).to.deep.include(expectedResult[1]);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error:', body: 'Fake error' }, color: 'red' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'info', [], []);
            receiver = new WordpressReceiver(context);
            sandbox.stub(receiver.http, 'get').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: logs', () => {

        let requestStub: SinonStub, fakeRequest: any, fakeResponse: any;

        beforeEach(() => {

            getWordpressProjectsStub = sandbox.stub(WordpressReceiver.prototype, 'getWordpressProjects');
            requestStub = sandbox.stub(HttpWrapper.prototype, 'createRawRequest');
            fakeRequest = { on: sandbox.stub(), end: sandbox.stub() };
            fakeResponse = { on: sandbox.stub() };
        });

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getWordpressProjectsStub.resolves([]);
            context = new Context('wordpress', 'logs', [], []);
            receiver = new WordpressReceiver(context);

            await receiver.logs();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'logs', [], ['-n', 'fakename']);
            receiver = new WordpressReceiver(context);

            await receiver.logs();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project found', async () => {

            const expectedResult = { type: 'text', value: 'fake logs' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'logs', [], ['--name', 'fakeproject']);
            receiver = new WordpressReceiver(context);
            const result = { logs: 'fake logs' };
            sandbox.stub(receiver.http, 'get').resolves({ body: JSON.stringify(result) } as CustomOkResponse);

            await receiver.logs();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if --lines flag is set', async () => {

            const expectedResult = { type: 'text', value: 'fake logs' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'logs', [], ['--name', 'fakeproject', '--lines', '100']);
            receiver = new WordpressReceiver(context);
            const result = { logs: 'fake logs' };
            sandbox.stub(receiver.http, 'get').resolves({ body: JSON.stringify(result) } as CustomOkResponse);

            await receiver.logs();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if --tail flag is set', async () => {

            const expectedResult = { type: 'text', value: 'fake logs' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'logs', [], ['--name', 'fakeproject', '--tail', '100']);
            receiver = new WordpressReceiver(context);
            const result = { logs: 'fake logs' };
            sandbox.stub(receiver.http, 'get').resolves({ body: JSON.stringify(result) } as CustomOkResponse);

            await receiver.logs();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not fetch logs for fakeproject: Fake error' }, color: 'red' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'logs', [], []);
            receiver = new WordpressReceiver(context);
            sandbox.stub(receiver.http, 'get').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.logs();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should print live logs if -f flag is set', async () => {

            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('wordpress', 'logs', [], ['-f']);
            receiver = new WordpressReceiver(context);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');
            const liveTextLineStub = sandbox.stub(receiver.result, 'liveTextLine');
            fakeResponse.on.withArgs('data').yields('fake logs');
            requestStub.returns(fakeRequest).yields(fakeResponse);

            await receiver.logs();

            sandbox.assert.calledWith(liveTextLineStub, 'fake logs');
        });
    });

    describe('Method: restart', () => {

        beforeEach(() => {

            getWordpressProjectsStub = sandbox.stub(WordpressReceiver.prototype, 'getWordpressProjects');
        });

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getWordpressProjectsStub.resolves([]);
            context = new Context('backend', 'restart', [], []);
            receiver = new WordpressReceiver(context);

            await receiver.restart();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'restart', [], ['-n', 'fakename']);
            receiver = new WordpressReceiver(context);

            await receiver.restart();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is restarted', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Success.' }, color: 'green' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'restart', [], []);
            receiver = new WordpressReceiver(context);
            sandbox.stub(receiver.http, 'post').resolves({ body: 'Success.' } as CustomOkResponse);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.restart();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not restart project fakeproject: Fake error' }, color: 'red' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'restart', [], []);
            receiver = new WordpressReceiver(context);
            sandbox.stub(receiver.http, 'post').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.restart();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: run', () => {

        beforeEach(() => {

            getWordpressProjectsStub = sandbox.stub(WordpressReceiver.prototype, 'getWordpressProjects');
        });

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getWordpressProjectsStub.resolves([]);
            context = new Context('backend', 'run', [], []);
            receiver = new WordpressReceiver(context);

            await receiver.run();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'run', [], ['-n', 'fakename']);
            receiver = new WordpressReceiver(context);

            await receiver.run();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if success', async () => {

            const expectedResult = { type: 'text', value: 'Success. Your app is running.' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'run', [], ['--name', 'fakeproject']);
            receiver = new WordpressReceiver(context);
            const result = { message: 'Success. Your app is running.' };
            sandbox.stub(receiver.http, 'post').resolves({ body: JSON.stringify(result) } as CustomOkResponse);

            await receiver.run();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not run project fakeproject: Fake error' }, color: 'red' };
            getWordpressProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'run', [], []);
            receiver = new WordpressReceiver(context);
            sandbox.stub(receiver.http, 'post').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.run();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });
});
