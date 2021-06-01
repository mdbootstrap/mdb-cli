import config from '../../../../config';
import Context from '../../../../context';
import CommandResult from '../../../../utils/command-result';
import NormalConfigStrategy from '../../../../receivers/strategies/config/normal-config-strategy';
import DotMdbConfigManager from '../../../../utils/managers/dot-mdb-config-manager';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Strategy: NormalConfigStrategy', () => {

    const sandbox = createSandbox();

    let result: CommandResult,
        context: Context,
        strategy: NormalConfigStrategy,
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

    describe('Method: setValue()', function () {

        it('should throw error if invalid package manager', function () {

            context = new Context('', '', [], []);
            context.registerNonArgFlags(['global']);
            strategy = new NormalConfigStrategy(context, result);

            try {
                strategy.setValue('packageManager', 'value');
            } catch (e) {
                expect(e.message.toLowerCase()).to.include('invalid');
                return;
            }

            chai.assert.fail('ConfigStrategy should throw an error');
        });

        it('should throw error if invalid publish method', function () {

            context = new Context('', '', [], []);
            context.registerNonArgFlags(['global']);
            strategy = new NormalConfigStrategy(context, result);

            try {
                strategy.setValue('publishMethod', 'value');
            } catch (e) {
                expect(e.message.toLowerCase()).to.include('invalid');
                return;
            }

            chai.assert.fail('ConfigStrategy should throw an error');
        });

        it('should set and save global config value', function () {

            context = new Context('', '', [], ['--global']);
            context.registerNonArgFlags(['global']);
            strategy = new NormalConfigStrategy(context, result);

            strategy.setValue('packageManager', 'npm');

            sandbox.assert.calledOnceWithExactly(setValue, 'packageManager', 'npm', true);
            sandbox.assert.calledOnceWithExactly(save, 'fake/cwd', true);
        });

        it('should set and save config value', function () {

            context = new Context('', '', [], []);
            context.registerNonArgFlags(['global']);
            strategy = new NormalConfigStrategy(context, result);

            strategy.setValue('publishMethod', 'ftp');

            sandbox.assert.calledOnceWithExactly(setValue, 'publishMethod', 'ftp', false);
            sandbox.assert.calledOnceWithExactly(save, 'fake/cwd', false);
        });
    });

    describe('Method: unsetValue()', function () {

        it('should unset global config value', function () {

            context = new Context('', '', [], ['--global', '--unset']);
            context.registerNonArgFlags(['global', 'unset']);
            strategy = new NormalConfigStrategy(context, result);

            strategy.unsetValue('name');

            sandbox.assert.calledOnceWithExactly(unsetValue, 'name', true);
            sandbox.assert.calledOnceWithExactly(save, 'fake/cwd', true);
        });

        it('should unset config value', function () {

            context = new Context('', '', [], ['--unset']);
            context.registerNonArgFlags(['global', 'unset']);
            strategy = new NormalConfigStrategy(context, result);

            strategy.unsetValue('name');

            sandbox.assert.calledOnceWithExactly(unsetValue, 'name', false);
            sandbox.assert.calledOnceWithExactly(save, 'fake/cwd', false);
        });
    });
});
