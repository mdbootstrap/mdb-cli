'use strict';

const Context = require('../../context');
const BlankReceiver = require('../../receivers/blank-receiver');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const fs = require('fs');


describe('Receiver: blank', () => {

    let context, receiver;

    beforeEach(() => {

        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: init', () => {

        let createConfirmationPromptStub,
            createJenkinsfileStub,
            createTextPromptStub,
            eraseDirectoriesStub,
            existsSyncStub;

        beforeEach(() => {

            sandbox.stub(process, 'cwd').returns('fake/cwd');
            existsSyncStub = sandbox.stub(fs, 'existsSync');
            sandbox.stub(fs, 'mkdirSync');
            context = new Context('blank', 'init', '', ['--name', 'fakeName']);
            receiver = new BlankReceiver(context);
            sandbox.stub(context, '_loadPackageJsonConfig');
            sandbox.stub(context, 'loadPackageManager').resolves();
            sandbox.stub(context, 'packageManager').value({ init: sandbox.stub().returns('') });
            sandbox.stub(context, 'mdbConfig').value({ setValue: sandbox.stub(), save: sandbox.stub() });
            createConfirmationPromptStub = sandbox.stub(helpers, 'createConfirmationPrompt');
            createJenkinsfileStub = sandbox.stub(helpers, 'createJenkinsfile');
            createTextPromptStub = sandbox.stub(helpers, 'createTextPrompt');
            eraseDirectoriesStub = sandbox.stub(helpers, 'eraseDirectories');
        });

        it('should init blank project and return expected result', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: '' }, color: 'green' };
            existsSyncStub.returns(false);
            eraseDirectoriesStub.resolves();
            createJenkinsfileStub.resolves();

            await receiver.init();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should try init blank project and return expected result if error in erase directories', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Fake error' }, color: 'red' };
            existsSyncStub.returns(true);
            createTextPromptStub.resolves('fakeName');
            createConfirmationPromptStub.resolves(false);
            eraseDirectoriesStub.returns(Promise.reject('Fake error'));
            createJenkinsfileStub.resolves();
            receiver.flags.name = undefined;

            await receiver.init();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should try init blank project and return expected result if error creating Jenkinsfile', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error', body: 'Fake error' }, color: 'red' };
            receiver.context.packageJsonConfig = { scripts: { test: 'fake test script' } };
            existsSyncStub.withArgs('fake/cwd/fakeName').returns(true);
            existsSyncStub.withArgs('fake/cwd/newProjectName').returns(false);
            createConfirmationPromptStub.resolves(true);
            createTextPromptStub.resolves('newProjectName');
            eraseDirectoriesStub.resolves();
            createJenkinsfileStub.returns(Promise.reject('Fake error'));

            await receiver.init();

            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });
});
