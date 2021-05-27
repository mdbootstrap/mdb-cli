'use strict';

const config = require('../../../../config');
const Context = require('../../../../context');
const DomainConfigStrategy = require('../../../../receivers/strategies/config/domain-config-strategy');
const PublishCommand = require('../../../../commands/publish-command');
const sandbox = require('sinon').createSandbox();
const inquirer = require('inquirer');


describe('Strategy: DomainConfigStrategy', () => {

    beforeEach(() => {

        sandbox.stub(config, 'tokenDir').value('fake/token/dir');
        sandbox.stub(config, 'tokenFile').value('fake-token-file');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: setValue()', function () {

        it('should throw error if domain invalid', function () {
            const ctx = new Context('', '', [], []);

            sandbox.stub(ctx, 'authenticateUser').returns();

            const strategy = new DomainConfigStrategy(ctx, null);
            strategy.result = { addAlert: sandbox.stub() };

            sandbox.stub(strategy, '_validateDomain').throws(new Error('invalid domain'));

            try {
                strategy.setValue('fake', 'value');
            } catch (e) {
                expect(e.message).to.include('invalid');
                return;
            }

            chai.assert.fail('AuthStrategy should throw an error');
        });

        it('should save domain name in .mdb', async function () {
            const ctx = new Context('', '', [], []);

            sandbox.stub(ctx, 'authenticateUser').returns();
            const dotMdbSetVal = sandbox.stub(ctx.mdbConfig, 'setValue').returns();
            const dotMdbSave = sandbox.stub(ctx.mdbConfig, 'save').returns();

            const strategy = new DomainConfigStrategy(ctx, null);
            strategy.result = { addAlert: sandbox.stub() };

            sandbox.stub(strategy, '_validateDomain').returns();
            sandbox.stub(strategy, '_verifyDomainName').resolves({ domain: 'value' });
            sandbox.stub(strategy, '_publish').resolves();

            await strategy.setValue('fake', 'value');

            expect(dotMdbSetVal).to.have.been.calledWith('fake', 'value');
            expect(dotMdbSave).to.have.been.calledOnce;
        });

        it('should re-publish the project', async function () {
            const ctx = new Context('', '', [], []);

            sandbox.stub(ctx, 'authenticateUser').returns();
            sandbox.stub(ctx.mdbConfig, 'setValue').returns();
            sandbox.stub(ctx.mdbConfig, 'save').returns();

            const strategy = new DomainConfigStrategy(ctx, null);
            strategy.result = { addAlert: sandbox.stub() };

            sandbox.stub(strategy, '_validateDomain').returns();
            sandbox.stub(strategy, '_verifyDomainName').resolves({ domain: 'value' });
            const publish = sandbox.stub(strategy, '_publish').resolves();

            await strategy.setValue('fake', 'value');

            expect(publish).to.have.been.calledOnce;
        });
    });

    describe('Method: unsetValue()', function () {

        it('should delete domain key from .mdb if frontend project', async function () {
            const ctx = new Context('', '', [], []);

            sandbox.stub(ctx, 'authenticateUser').returns();
            sandbox.stub(ctx.mdbConfig, 'getValue').withArgs('meta.type').returns('frontend');
            const unset = sandbox.stub(ctx.mdbConfig, 'unsetValue');
            sandbox.stub(ctx.mdbConfig, 'save').returns();

            const strategy = new DomainConfigStrategy(ctx, null);
            strategy.result = { addAlert: sandbox.stub() };

            sandbox.stub(strategy, '_unsetDomain').resolves({ url: 'fake/url' });

            await strategy.unsetValue('domain');

            expect(unset).to.have.been.calledWith('domain');
        });

        it('should set domain to default if not frontend project', async function () {
            const ctx = new Context('', '', [], []);

            sandbox.stub(ctx, 'authenticateUser').returns();
            sandbox.stub(ctx.mdbConfig, 'getValue').withArgs('meta.type').returns('backend');
            const set = sandbox.stub(ctx.mdbConfig, 'setValue');
            sandbox.stub(ctx.mdbConfig, 'save').returns();

            const strategy = new DomainConfigStrategy(ctx, null);
            strategy.result = { addAlert: sandbox.stub() };

            sandbox.stub(strategy, '_unsetDomain').resolves({ url: 'fake.domain' });

            await strategy.unsetValue('domain');

            expect(set).to.have.been.calledWith('domain', 'fake.domain');
        });
    });

    it('should return domain name if available', async function () {
        const ctx = new Context('', '', [], []);
        sandbox.stub(ctx, 'authenticateUser').returns();

        const strategy = new DomainConfigStrategy(ctx, null);
        strategy.result = { addAlert: sandbox.stub() };

        sandbox.stub(strategy, '_checkIfExists').resolves(true);

        const result = await strategy._verifyDomainName('fake.domain');

        expect(result).to.deep.eq({ domain: 'fake.domain' });
    });

    it('should run inquirer if domain taken', async function () {
        const ctx = new Context('', '', [], []);
        sandbox.stub(ctx, 'authenticateUser').returns();

        const strategy = new DomainConfigStrategy(ctx, null);
        strategy.result = { addAlert: sandbox.stub() };

        sandbox.stub(strategy, '_checkIfExists').resolves(false);
        const render = sandbox.stub();
        const prompt = sandbox.stub().returns({ ui: { activePrompt: { render } }, domain: 'fake.domain.2' });
        sandbox.stub(inquirer, 'createPromptModule').returns(prompt);

        await strategy._verifyDomainName('fake.domain');

        expect(render).to.have.been.calledOnce;
        expect(prompt).to.have.been.calledOnce;
    });

    it('should run the "publish" command', async function () {
        const ctx = new Context('', '', [], []);
        sandbox.stub(ctx, 'authenticateUser').returns();

        const strategy = new DomainConfigStrategy(ctx, null);
        strategy.result = { addAlert: sandbox.stub() };

        sandbox.stub(ctx.mdbConfig, 'getValue').returns('frontend');
        const publish = sandbox.stub(PublishCommand.prototype, 'execute').resolves();
        await strategy._publish();

        expect(publish).to.have.been.calledOnce;
    });
});
