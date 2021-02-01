'use strict';

const fs = require('fs');
const Context = require('../../context');
const RepoReceiver = require('../../receivers/repo-receiver');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');

describe('Receiver: repo', () => {

    let context, receiver;

    beforeEach(() => {

        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: init', function () {

        let createJenkinsfileStub,
            fsExistsSyncStub;

        beforeEach(() => {

            sandbox.stub(process, 'cwd').returns('fake/cwd');
            context = new Context('repo', 'init', '', []);
            receiver = new RepoReceiver(context);
            createJenkinsfileStub = sandbox.stub(helpers, 'createJenkinsfile');
            fsExistsSyncStub = sandbox.stub(fs, 'existsSync');
        });

        it('should init repo and return expected result', async () => {

            const gitInitStub = sandbox.stub(receiver.git, 'init');
            const gitAddOriginStub = sandbox.stub(receiver.git, 'addOrigin');
            const gitCommitStub = sandbox.stub(receiver.git, 'commit');
            const gitPushStub = sandbox.stub(receiver.git, 'push');
            const expectedResult = { type: 'alert', value: { title: '\nSuccess', body: 'Project fakeName successfully created. Repository url: \n' }, color: 'green' };
            sandbox.stub(receiver.http, 'post').returns({ body: '{"name":"fakeName","url":"","webhook":"true","saved":"true","pipeline":"true"}' });
            sandbox.stub(receiver, '_getProjectName').returns('fakeName');
            createJenkinsfileStub.resolves();
            fsExistsSyncStub.returns(false);

            await receiver.init();

            sandbox.assert.callOrder(gitInitStub, gitAddOriginStub, gitCommitStub, gitPushStub);
            expect(createJenkinsfileStub).to.have.been.calledOnce;
            expect(receiver.result.messages[0]).to.deep.include(expectedResult);
        });

        it('should setOrigin repo and return expected result if .git exists', async () => {

            const gitSetOriginStub = sandbox.stub(receiver.git, 'setOrigin');
            const gitPushStub = sandbox.stub(receiver.git, 'push');
            const expectedResult = { type: 'alert', value: { title: '\nSuccess', body: 'Project fakeName successfully created. Repository url: \n' }, color: 'green' };
            sandbox.stub(receiver.http, 'post').returns({ body: '{"name":"fakeName","url":"","webhook":"true","saved":"true","pipeline":"true"}' });
            sandbox.stub(receiver, '_getProjectName').returns('fakeName');
            createJenkinsfileStub.resolves();
            fsExistsSyncStub.returns(true);

            await receiver.init();

            sandbox.assert.callOrder(gitSetOriginStub, gitPushStub);
            expect(receiver.result.messages[0]).to.deep.include(expectedResult);
        });

        it('should create package.json if cannot get projectName', async () => {

            const createPackageJsonStub = sandbox.stub(receiver, '_createPackageJson');
            sandbox.stub(context, '_loadPackageJsonConfig').callsFake(() => {
                receiver.context.packageJsonConfig = { name: 'fakeName' };
            });
            sandbox.stub(receiver.git, 'setOrigin');
            sandbox.stub(receiver.git, 'push');
            sandbox.stub(receiver.http, 'post').returns({ body: '{"name":"fakeName","url":"","webhook":"true","saved":"true","pipeline":"true"}' });
            createJenkinsfileStub.resolves();
            fsExistsSyncStub.returns(true);

            await receiver.init();

            expect(createPackageJsonStub).to.have.been.calledOnce;
        });

        it('should throw file required error if package.json is empty', async () => {

            sandbox.stub(receiver, '_createPackageJson');

            try {
                await receiver.init();
            } catch (e) {
                return expect(e.message).to.be.eq('package.json file is required.');
            }

            chai.assert.fail('_getProjectName function should throw error if package.json is empty');
        });
    });
});
