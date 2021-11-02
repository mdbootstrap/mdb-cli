import config from '../../../../config';
import Context from '../../../../context';
import CommandResult from '../../../../utils/command-result';
import DotMdbConfigManager from '../../../../utils/managers/dot-mdb-config-manager';
import { ProjectNameConfigStrategy } from '../../../../receivers/strategies/config';
import { createSandbox, SinonStub } from 'sinon';

describe('Strategy: ProjectConfigStrategy', () => {

    const sandbox = createSandbox();

    let result: CommandResult,
        context: Context,
        strategy: ProjectNameConfigStrategy,
        loadPackageJsonConfig: SinonStub,
        setPackageJsonValue: SinonStub,
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
        loadPackageJsonConfig = sandbox.stub(Context.prototype, '_loadPackageJsonConfig');
        setPackageJsonValue = sandbox.stub(Context.prototype, 'setPackageJsonValue');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: setValue()', function () {

        it('should set projectName in .mdb config file', function () {

            context = new Context('', '', [], []);
            context.packageJsonConfig = {};
            strategy = new ProjectNameConfigStrategy(context);

            strategy.setValue('projectName', 'fake-name');

            sandbox.assert.notCalled(setPackageJsonValue);
            sandbox.assert.calledOnceWithExactly(setValue, 'projectName', 'fake-name');
            sandbox.assert.calledOnceWithExactly(save);
        });

        it('should set projectName in package.json and .mdb config file', function () {

            context = new Context('', '', [], []);
            context.packageJsonConfig = { name: '' };
            strategy = new ProjectNameConfigStrategy(context);

            strategy.setValue('projectName', 'fake-name');

            sandbox.assert.calledOnceWithExactly(setPackageJsonValue, 'name', 'fake-name');
            sandbox.assert.calledOnceWithExactly(setValue, 'projectName', 'fake-name');
            sandbox.assert.calledOnceWithExactly(save);
        });
    });

    describe('Method: unsetValue()', function () {

        it('should unset projectName from .mdb config file', function () {

            context = new Context('', '', [], []);
            context.packageJsonConfig = {};
            strategy = new ProjectNameConfigStrategy(context);

            strategy.unsetValue('projectName');

            sandbox.assert.calledOnceWithExactly(unsetValue, 'projectName');
            sandbox.assert.calledOnceWithExactly(save);
        });
    });
});
