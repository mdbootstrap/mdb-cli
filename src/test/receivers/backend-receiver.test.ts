import config from '../../config';
import Context from '../../context';
import helpers from '../../helpers';
import { Project } from '../../models/project';
import HttpWrapper, { CustomOkResponse, CustomErrorResponse } from '../../utils/http-wrapper';
import FtpPublishStrategy from '../../receivers/strategies/publish/ftp-publish-strategy';
import BackendReceiver from '../../receivers/backend-receiver';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Receiver: backend', () => {

    const sandbox = createSandbox();

    const fakeProject = {
        projectId: 1,
        user: { userNicename: 'fakeuser' },
        projectName: 'fakeproject',
        domainName: null,
        publishDate: '2019-06-24T06:49:53.000Z',
        editDate: '2019-06-24T06:49:53.000Z',
        repoUrl: null,
        status: 'backend',
        projectMeta: [{ metaKey: '_backend_technology', metaValue: 'faketechnology' }]
    };

    let context: Context,
        receiver: BackendReceiver,
        getBackendProjectsStub: SinonStub;

    beforeEach(() => {

        getBackendProjectsStub = sandbox.stub(BackendReceiver.prototype, 'getBackendProjects');
        sandbox.stub(config, 'projectsDomain').value('http://fake.domain');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: list', () => {

        it('should set expected result if user does not have any projects', async () => {

            context = new Context('backend', '', [], []);
            receiver = new BackendReceiver(context);
            getBackendProjectsStub.resolves([]);

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
                status: 'backend',
                projectMeta: [{ metaKey: '_backend_technology', metaValue: 'faketechnology1' }, { metaKey: '_container_port', metaValue: '12345' }]
            };
            const fakeProject2 = {
                projectId: 2,
                user: { userNicename: 'fakeuser2' },
                projectName: 'fakeproject2',
                domainName: null,
                publishDate: '2019-06-24T06:49:53.000Z',
                editDate: '2019-06-24T06:49:53.000Z',
                repoUrl: 'fake.repo.url',
                status: 'backend',
                projectMeta: []
            };
            const expectedResult = [{
                'Project Name': 'fakeproject1',
                'Published': new Date(fakeProject1.publishDate).toLocaleString(),
                'Edited': new Date(fakeProject1.editDate).toLocaleString(),
                'Technology': 'faketechnology1',
                'Repository': '-',
                'URL': 'http://fake.domain:12345'
            }, {
                'Project Name': 'fakeproject2',
                'Published': new Date(fakeProject2.publishDate).toLocaleString(),
                'Edited': new Date(fakeProject2.editDate).toLocaleString(),
                'Technology': undefined,
                'Repository': 'fake.repo.url',
                'URL': 'Unavailable'
            }];
            getBackendProjectsStub.resolves([fakeProject1 as Project, fakeProject2 as Project]);
            context = new Context('backend', '', [], []);
            receiver = new BackendReceiver(context);

            await receiver.list();

            expect(receiver.result.messages[0].value).to.eql(expectedResult);
        });
    });

    describe('Method: delete', () => {

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getBackendProjectsStub.resolves([]);
            context = new Context('backend', 'delete', [], []);
            receiver = new BackendReceiver(context);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'delete', [], ['-n', 'fakename']);
            receiver = new BackendReceiver(context);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if the project was deleted', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Project successfully deleted.' }, color: 'green' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'delete', [], ['--name', 'fakeproject', '--ftp-only']);
            receiver = new BackendReceiver(context);
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakeproject');
            sandbox.stub(receiver.http, 'delete').resolves({ body: 'Project successfully deleted.' } as CustomOkResponse);

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if user enters wrong project name', async () => {

            const expectedResult = { type: 'text', value: 'The names do not match.' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'delete', [], ['--name', 'fakeproject']);
            receiver = new BackendReceiver(context);
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakename');

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not delete fakeproject: Fake error' }, color: 'red' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'delete', [], []);
            receiver = new BackendReceiver(context);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');
            sandbox.stub(helpers, 'createTextPrompt').resolves('fakeproject');
            sandbox.stub(receiver.http, 'delete').rejects({ message: 'Fake error' });

            await receiver.delete();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: kill', () => {

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getBackendProjectsStub.resolves([]);
            context = new Context('backend', 'kill', [], []);
            receiver = new BackendReceiver(context);

            await receiver.kill();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'kill', [], ['-n', 'fakename']);
            receiver = new BackendReceiver(context);

            await receiver.kill();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is killed', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Success.' }, color: 'green' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'kill', [], []);
            receiver = new BackendReceiver(context);
            sandbox.stub(receiver.http, 'delete').resolves({ body: 'Success.' } as CustomOkResponse);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.kill();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not kill fakeproject: Fake error' }, color: 'red' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'kill', [], ['--remove']);
            receiver = new BackendReceiver(context);
            sandbox.stub(receiver.http, 'delete').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.kill();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: get', () => {

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getBackendProjectsStub.resolves([]);
            context = new Context('backend', 'get', [], []);
            receiver = new BackendReceiver(context);

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'get', [], ['-n', 'fakename']);
            receiver = new BackendReceiver(context);

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is downloaded from ftp', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Download completed.' }, color: 'green' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'get', [], ['--name', 'fakeproject']);
            receiver = new BackendReceiver(context);
            sandbox.stub(helpers, 'eraseDirectories').resolves();
            sandbox.stub(helpers, 'downloadFromFTP').resolves('Download completed.');

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is downloaded using git', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Download completed.' }, color: 'green' };
            const fakeProject1 = { ...fakeProject, ...{ repoUrl: 'fake.url' } };
            getBackendProjectsStub.resolves([fakeProject1]);
            context = new Context('backend', 'get', [], []);
            receiver = new BackendReceiver(context);
            sandbox.stub(receiver.git, 'clone').resolves('Download completed.');
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not download fakeproject: Fake error' }, color: 'red' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'get', [], ['--force']);
            receiver = new BackendReceiver(context);
            sandbox.stub(helpers, 'eraseDirectories').resolves();
            sandbox.stub(helpers, 'downloadFromFTP').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.get();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: info', () => {

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getBackendProjectsStub.resolves([]);
            context = new Context('backend', 'info', [], []);
            receiver = new BackendReceiver(context);

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'info', [], ['-n', 'fakename']);
            receiver = new BackendReceiver(context);

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is running', async () => {

            const expectedResult = [
                { type: 'alert', value: { title: 'Status:', body: 'running' }, color: 'turquoise' },
                { type: 'alert', value: { title: 'Started at:', body: '2021-01-11 11:11:11' }, color: 'turquoise' },
                { type: 'alert', value: { title: 'App URL:', body: 'http://fake.domain:1234' }, color: 'turquoise' }
            ];
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'info', [], ['--name', 'fakeproject']);
            receiver = new BackendReceiver(context);
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
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'info', [], []);
            receiver = new BackendReceiver(context);
            const result = { startedAt: undefined, killedAt: '2021-01-11 11:11:11', port: undefined };
            sandbox.stub(receiver.http, 'get').resolves({ body: JSON.stringify(result) } as CustomOkResponse);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult[0]);
            expect(receiver.result.messages).to.deep.include(expectedResult[1]);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error:', body: 'Fake error' }, color: 'red' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'info', [], []);
            receiver = new BackendReceiver(context);
            sandbox.stub(receiver.http, 'get').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.info();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: logs', () => {

        let requestStub: any, fakeRequest: any, fakeResponse: any;

        beforeEach(() => {

            requestStub = sandbox.stub(HttpWrapper.prototype, 'createRawRequest');
            fakeRequest = { on: sandbox.stub(), end: sandbox.stub() };
            fakeResponse = { on: sandbox.stub() };
        });

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getBackendProjectsStub.resolves([]);
            context = new Context('backend', 'logs', [], []);
            receiver = new BackendReceiver(context);

            await receiver.logs();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'logs', [], ['-n', 'fakename']);
            receiver = new BackendReceiver(context);

            await receiver.logs();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project found', async () => {

            const expectedResult = { type: 'text', value: 'fake logs' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'logs', [], ['--name', 'fakeproject']);
            receiver = new BackendReceiver(context);
            const result = { logs: 'fake logs' };
            sandbox.stub(receiver.http, 'get').resolves({ body: JSON.stringify(result) } as CustomOkResponse);

            await receiver.logs();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if --lines flag is set', async () => {

            const expectedResult = { type: 'text', value: 'fake logs' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'logs', [], ['--name', 'fakeproject', '--lines', '100']);
            receiver = new BackendReceiver(context);
            const result = { logs: 'fake logs' };
            sandbox.stub(receiver.http, 'get').resolves({ body: JSON.stringify(result) } as CustomOkResponse);

            await receiver.logs();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if --tail flag is set', async () => {

            const expectedResult = { type: 'text', value: 'fake logs' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'logs', [], ['--name', 'fakeproject', '--tail', '100']);
            receiver = new BackendReceiver(context);
            const result = { logs: 'fake logs' };
            sandbox.stub(receiver.http, 'get').resolves({ body: JSON.stringify(result) } as CustomOkResponse);

            await receiver.logs();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not fetch logs for fakeproject: Fake error' }, color: 'red' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'logs', [], []);
            receiver = new BackendReceiver(context);
            sandbox.stub(receiver.http, 'get').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.logs();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should print live logs if -f flag is set', async () => {

            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'logs', [], ['-f']);
            receiver = new BackendReceiver(context);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');
            const liveTextLineStub = sandbox.stub(receiver.result, 'liveTextLine');
            fakeResponse.on.withArgs('data').yields('fake logs');
            requestStub.returns(fakeRequest).yields(fakeResponse);

            await receiver.logs();

            sandbox.assert.calledWith(liveTextLineStub, 'fake logs');
        });
    });

    describe('Method: rename', () => {

        const fakeName = 'fake-name';
        const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Project name successfully changed to fake-name' }, color: 'green' };

        let promptStub: any;

        beforeEach(() => {

            promptStub = sandbox.stub(helpers, 'createTextPrompt');
            sandbox.stub(helpers, 'serializeJsonFile').resolves();
            context = new Context('backend', 'rename', [], []);
            sandbox.stub(context.mdbConfig, 'setValue');
            sandbox.stub(context.mdbConfig, 'save');
            receiver = new BackendReceiver(context);
            sandbox.stub(receiver.http, 'post').resolves({ body: JSON.stringify({ message: 'Fake message' }) } as CustomOkResponse);
        });

        it('should rename project and return expected result if name defined in package.json', async () => {

            receiver.context.packageJsonConfig = { name: 'old-name' };
            promptStub.resolves(fakeName);

            await receiver.rename();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should rename project and return expected result if no package.json', async () => {

            receiver.context.packageJsonConfig = {};
            receiver.flags['new-name'] = fakeName;

            await receiver.rename();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: restart', () => {

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getBackendProjectsStub.resolves([]);
            context = new Context('backend', 'restart', [], []);
            receiver = new BackendReceiver(context);

            await receiver.restart();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'restart', [], ['-n', 'fakename']);
            receiver = new BackendReceiver(context);

            await receiver.restart();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project is restarted', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: 'Success.' }, color: 'green' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'restart', [], []);
            receiver = new BackendReceiver(context);
            sandbox.stub(receiver.http, 'post').resolves({ body: 'Success.' } as CustomOkResponse);
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.restart();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not restart project fakeproject: Fake error' }, color: 'red' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'restart', [], []);
            receiver = new BackendReceiver(context);
            sandbox.stub(receiver.http, 'post').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.restart();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: run', () => {

        it('should set expected result if user does not have any projects', async () => {

            const expectedResult = { type: 'text', value: 'You don\'t have any projects yet.' };
            getBackendProjectsStub.resolves([]);
            context = new Context('backend', 'run', [], []);
            receiver = new BackendReceiver(context);

            await receiver.run();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if project not found', async () => {

            const expectedResult = { type: 'text', value: 'Project fakename not found.' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'run', [], ['-n', 'fakename']);
            receiver = new BackendReceiver(context);

            await receiver.run();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if success', async () => {

            const expectedResult = { type: 'text', value: 'Success. Your app is running.' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'run', [], ['--name', 'fakeproject']);
            receiver = new BackendReceiver(context);
            const result = { message: 'Success. Your app is running.' };
            sandbox.stub(receiver.http, 'post').resolves({ body: JSON.stringify(result) } as CustomOkResponse);

            await receiver.run();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Could not run project fakeproject: Fake error' }, color: 'red' };
            getBackendProjectsStub.resolves([fakeProject]);
            context = new Context('backend', 'run', [], []);
            receiver = new BackendReceiver(context);
            sandbox.stub(receiver.http, 'post').rejects({ message: 'Fake error' });
            sandbox.stub(helpers, 'createListPrompt').resolves('fakeproject');

            await receiver.run();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: getProjectName', () => {

        const fakeName = 'fake-name';

        it('should return project name if defined in package.json', () => {

            context = new Context('backend', 'rename', [], []);
            receiver = new BackendReceiver(context);
            sandbox.stub(receiver.context, 'packageJsonConfig').value({ name: fakeName });

            const projectName = receiver.getProjectName();

            expect(projectName).to.be.eq(fakeName);
        });

        it('should return project name if defined in config file', () => {

            context = new Context('backend', 'rename', [], []);
            sandbox.stub(context.mdbConfig, 'getValue').returns(fakeName);
            receiver = new BackendReceiver(context);
            sandbox.stub(receiver.context, 'packageJsonConfig').value({});

            const projectName = receiver.getProjectName();

            expect(projectName).to.be.eq(fakeName);
        });

        it('should return undefined if project name not defined', () => {

            context = new Context('backend', 'rename', [], []);
            sandbox.stub(context.mdbConfig, 'getValue').returns(undefined);
            receiver = new BackendReceiver(context);
            sandbox.stub(receiver.context, 'packageJsonConfig').value({});

            const projectName = receiver.getProjectName();

            expect(projectName).to.be.eq(undefined);
        });
    });

    describe('Method: askForProjectName', () => {

        it('should get and save project name', async () => {

            const context = new Context('backend', '', [], []);
            const receiver = new BackendReceiver(context);
            const askStub = sandbox.stub(helpers, 'createTextPrompt').resolves('fakeProjectName');
            const setValueStub = sandbox.stub(receiver.context.mdbConfig, 'setValue');
            const saveStub = sandbox.stub(receiver.context.mdbConfig, 'save');

            await receiver.askForProjectName();

            sandbox.assert.calledOnce(askStub);
            sandbox.assert.calledOnce(setValueStub);
            sandbox.assert.calledOnce(saveStub);
        });
    });

    describe('Method: publish', () => {

        let publishStub: SinonStub, textPromptStub: SinonStub;

        beforeEach(() => {

            publishStub = sandbox.stub(FtpPublishStrategy.prototype, 'publish');
            textPromptStub = sandbox.stub(helpers, 'createTextPrompt');
        });

        it('should use FtpPublishStrategy to upload files and show prompt if project name conflict error', async () => {

            context = new Context('backend', 'publish', [], []);
            receiver = new BackendReceiver(context);
            receiver.context.packageJsonConfig.name = 'fakeProjectName';

            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('backend.platform').returns('node12');
            sandbox.stub(receiver.context, 'setPackageJsonValue');
            sandbox.stub(receiver.context.mdbConfig, 'setValue');
            sandbox.stub(receiver.context.mdbConfig, 'save');
            textPromptStub.resolves('fakeProjectName');
            publishStub.onFirstCall().rejects({ statusCode: 409, message: 'project name' } as CustomErrorResponse);
            publishStub.onSecondCall().resolves({ body: JSON.stringify({ message: '', url: '' }) } as CustomOkResponse);

            await receiver.publish();

            sandbox.assert.calledOnce(textPromptStub);
            sandbox.assert.calledTwice(publishStub);
        });

        it('should use FtpPublishStrategy to upload files and show prompt if domain name conflict error', async () => {

            context = new Context('backend', 'publish', [], []);
            receiver = new BackendReceiver(context);
            receiver.context.packageJsonConfig.name = 'fakeProjectName';

            sandbox.stub(receiver.context.mdbConfig, 'getValue').withArgs('backend.platform').returns('node12');
            sandbox.stub(receiver.context.mdbConfig, 'setValue');
            sandbox.stub(receiver.context.mdbConfig, 'save');
            textPromptStub.resolves('fake.domain');
            publishStub.onFirstCall().rejects({ statusCode: 403, message: 'domain name' } as CustomErrorResponse);
            publishStub.onSecondCall().resolves({ body: JSON.stringify({ message: '', url: '' }) } as CustomOkResponse);

            await receiver.publish();

            sandbox.assert.calledOnce(textPromptStub);
            sandbox.assert.calledTwice(publishStub);
        });

        it('should use FtpPublishStrategy to upload files and reject if unknown error', async () => {

            context = new Context('backend', 'publish', [], []);
            receiver = new BackendReceiver(context);
            receiver.context.packageJsonConfig.name = 'fakeProjectName';

            const alertStub = sandbox.stub(receiver.result, 'addAlert');
            const getValueStub = sandbox.stub(receiver.context.mdbConfig, 'getValue');
            getValueStub.withArgs('backend.platform').returns('node12');
            sandbox.stub(receiver.context.mdbConfig, 'setValue');
            sandbox.stub(receiver.context.mdbConfig, 'save');
            publishStub.onFirstCall().rejects({ statusCode: 500, message: 'Fake error' } as CustomErrorResponse);

            await receiver.publish();

            sandbox.assert.calledOnce(publishStub);
            expect(alertStub).to.have.been.calledWith('red');
        });
    });
});
