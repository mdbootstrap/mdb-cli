import fs from 'fs';
import Context from '../../context';
import helpers from '../../helpers';
import ComposeReceiver from '../../receivers/compose-receiver';
import PublishCommand from '../../commands/publish-command';
import InitCommand from '../../commands/init-command';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Receiver: compose', () => {

    const sandbox = createSandbox();

    let context: Context,
        receiver: ComposeReceiver;

    beforeEach(() => {

        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: init', () => {

        let confirmationPrompt: SinonStub,
            existsSync: SinonStub,
            listPrompt: SinonStub,
            passPrompt: SinonStub,
            textPrompt: SinonStub;

        beforeEach(() => {

            context = new Context('compose', 'init', [], []);
            receiver = new ComposeReceiver(context);
            sandbox.stub(context, '_loadPackageJsonConfig');
            sandbox.stub(context, 'loadPackageManager').resolves();
            sandbox.stub(context, 'packageManager').value({ init: sandbox.stub().returns('') });
            sandbox.stub(context, 'mdbConfig').value({ setValue: sandbox.stub(), save: sandbox.stub() });
            confirmationPrompt = sandbox.stub(helpers, 'createConfirmationPrompt');
            listPrompt = sandbox.stub(helpers, 'createListPrompt');
            textPrompt = sandbox.stub(helpers, 'createTextPrompt');
            passPrompt = sandbox.stub(helpers, 'createPassPrompt');
            existsSync = sandbox.stub(fs, 'existsSync');
        });

        it('should create configuration for frontend and backend projects', async () => {

            listPrompt.onFirstCall().resolves('frontend').onSecondCall().resolves('backend').onThirdCall().resolves('node8');
            textPrompt.onFirstCall().resolves('./bad/path').onSecondCall().resolves('./frontend/project/path').onThirdCall().resolves('./backend/project/path');
            confirmationPrompt.onFirstCall().resolves(true).onSecondCall().resolves(false);
            existsSync.onFirstCall().returns(false).returns(true);
            const projects = [
                { type: 'frontend', path: './frontend/project/path' },
                { type: 'backend', path: './backend/project/path', technology: 'node8' }
            ];

            await receiver.init();

            // @ts-ignore
            sandbox.assert.calledOnceWithExactly(receiver.context.mdbConfig.setValue, 'compose.projects', projects);
        });

        it('should create configuration for database', async () => {

            textPrompt.onFirstCall().resolves('username').onSecondCall().resolves('dbname').onThirdCall().resolves('desc');
            listPrompt.onFirstCall().resolves('database').onSecondCall().resolves('mysql8');
            confirmationPrompt.resolves(false);
            passPrompt.resolves('pass');
            const projects = [{ type: 'database', db: 'mysql8', user: 'username', pass: 'pass', name: 'dbname', desc: 'desc' }];

            await receiver.init();

            // @ts-ignore
            sandbox.assert.calledOnceWithExactly(receiver.context.mdbConfig.setValue, 'compose.projects', projects);
        });
    });

    describe('Method: publish', () => {

        let getValue: SinonStub;

        beforeEach(() => {

            context = new Context('compose', 'publish', [], []);
            receiver = new ComposeReceiver(context);
            sandbox.stub(context, '_loadPackageJsonConfig');
            sandbox.stub(context, 'loadPackageManager').resolves();
            sandbox.stub(context, 'packageManager').value({ init: sandbox.stub().returns('') });
            getValue = sandbox.stub();
            sandbox.stub(context, 'mdbConfig').value({ getValue });
            sandbox.stub(fs, 'existsSync').resolves(true);
            sandbox.stub(process, 'chdir');
        });

        it('should publish frontend, backend and create the database', async () => {

            getValue.returns([
                { type: 'frontend', path: './frontend/project/path' },
                { type: 'backend', path: './backend/project/path', technology: 'node8' },
                { type: 'database', db: 'mysql8', user: 'username', pass: 'pass', name: 'dbname', desc: 'desc' }
            ]);
            const publish = sandbox.stub(PublishCommand.prototype, 'execute').resolves();
            const init = sandbox.stub(InitCommand.prototype, 'execute').resolves();

            await receiver.publish();

            sandbox.assert.calledTwice(publish);
            sandbox.assert.calledOnce(init);
        });

        it('should throw an error if configutation not found', async () => {

            try {

                await receiver.publish();
            } catch (err) {

                expect(err.message).to.include('Configuration not found, please use the `mdb compose init` command to create it.');
                return;
            }

            sandbox.assert.fail('publish() method should throw an error!')
        });
    });

});