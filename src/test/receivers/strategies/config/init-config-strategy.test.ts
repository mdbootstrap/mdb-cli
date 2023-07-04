import config from '../../../../config';
import Context from '../../../../context';
import CommandResult from '../../../../utils/command-result';
import { InitConfigStrategy } from '../../../../receivers/strategies/config';
import DotMdbConfigManager from '../../../../utils/managers/dot-mdb-config-manager';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';
import helpers from '../../../../helpers';

describe('Strategy: InitConfigStrategy', () => {

    const sandbox = createSandbox();

    let result: CommandResult,
        context: Context,
        strategy: InitConfigStrategy,
        save: SinonStub,
        setValue: SinonStub,
        unsetValue: SinonStub;

    beforeEach(() => {

        result = new CommandResult();
        sandbox.stub(process, 'cwd').returns('fake/cwd');
        sandbox.stub(Context.prototype, 'authenticateUser');
        sandbox.stub(config, 'tokenDir').value('fake/token/dir');
        sandbox.stub(config, 'tokenFile').value('fake-token-file');
        save = sandbox.stub(DotMdbConfigManager.prototype, 'save');
        setValue = sandbox.stub(DotMdbConfigManager.prototype, 'setValue');
        unsetValue = sandbox.stub(DotMdbConfigManager.prototype, 'unsetValue');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: setValue()', function() {

        it('should set and save config values for frontend project', async function() {

            context = new Context('config', 'config', ['init'], []);
            strategy = new InitConfigStrategy(context);
            sandbox.stub(helpers, 'createTextPrompt').resolves('fake-name');
            sandbox.stub(helpers, 'createListPrompt').onFirstCall().resolves('frontend').onSecondCall().resolves('npm');
            sandbox.stub(helpers, 'generateRandomString').returns('fake-hash');

            await strategy.setValue('', '');

            sandbox.assert.calledWith(setValue, 'projectName', 'fake-name');
            sandbox.assert.calledWith(setValue, 'meta.type', 'frontend');
            sandbox.assert.calledWith(setValue, 'packageManager', 'npm');
            sandbox.assert.calledWith(setValue, 'hash', 'fake-hash');
            sandbox.assert.calledOnce(save);
        });

        it('should set and save config values for backend project', async function() {

            context = new Context('config', 'config', ['init'], []);
            strategy = new InitConfigStrategy(context);
            sandbox.stub(helpers, 'createTextPrompt').resolves('fake-name');
            sandbox.stub(helpers, 'createListPrompt').onFirstCall().resolves('backend').onSecondCall().resolves('node');
            sandbox.stub(helpers, 'generateRandomString').returns('fake-hash');

            await strategy.setValue('', '');

            sandbox.assert.calledWith(setValue, 'projectName', 'fake-name');
            sandbox.assert.calledWith(setValue, 'meta.type', 'backend');
            sandbox.assert.calledWith(setValue, 'backend.platform', 'node');
            sandbox.assert.calledWith(setValue, 'hash', 'fake-hash');
            sandbox.assert.calledOnce(save);
        });

        it('should set and save config values provided using flags', async function() {

            context = new Context('config', 'config', ['init'], ['--type', 'backend', '--name', 'fake-name', '--platform', 'node8']);
            strategy = new InitConfigStrategy(context);
            sandbox.stub(helpers, 'generateRandomString').returns('fake-hash');

            await strategy.setValue('', '');

            sandbox.assert.calledWith(setValue, 'projectName', 'fake-name');
            sandbox.assert.calledWith(setValue, 'meta.type', 'backend');
            sandbox.assert.calledWith(setValue, 'backend.platform', 'node8');
            sandbox.assert.calledWith(setValue, 'hash', 'fake-hash');
            sandbox.assert.calledOnce(save);
        });
    });

    describe('Method: unsetValue()', function() {

        it('should throw an error', function() {

            context = new Context('config', 'config', ['init'], ['--unset']);
            context.registerNonArgFlags(['unset']);
            strategy = new InitConfigStrategy(context);

            try {

                strategy.unsetValue('name');
            } catch (err) {

                expect(err.message).to.include('Invalid flag --unset');
                return;
            }

            sandbox.assert.fail('unsetValue() should throw an error');
        });
    });
});
