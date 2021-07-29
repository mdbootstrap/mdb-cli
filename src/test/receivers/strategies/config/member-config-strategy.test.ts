import config from '../../../../config';
import Context from '../../../../context';
import helpers from '../../../../helpers';
import CommandResult from '../../../../utils/command-result';
import HttpWrapper, { CustomOkResponse } from '../../../../utils/http-wrapper';
import DotMdbConfigManager from '../../../../utils/managers/dot-mdb-config-manager';
import MemberConfigStrategy from '../../../../receivers/strategies/config/member-config-strategy';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Strategy: MemberConfigStrategy', () => {

    const sandbox = createSandbox();

    let result: CommandResult,
        context: Context,
        strategy: MemberConfigStrategy,
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

        const projectName = 'fake-project-name';

        it('should throw error if invalid email', async function () {

            context = new Context('', '', [], []);
            strategy = new MemberConfigStrategy(context, result);

            try {
                await strategy.setValue('member', 'value@');
            } catch (e) {
                expect(e.message.toLowerCase()).to.include('invalid');
                return;
            }

            chai.assert.fail('ConfigStrategy should throw an error');
        });

        it('should throw error if invalid username', async function () {

            context = new Context('', '', [], []);
            strategy = new MemberConfigStrategy(context, result);

            try {
                await strategy.setValue('member', '');
            } catch (e) {
                expect(e.message.toLowerCase()).to.include('invalid');
                return;
            }

            chai.assert.fail('ConfigStrategy should throw an error');
        });

        it('should throw error if invalid role', async function () {

            context = new Context('', '', [], ['--role', 'role']);
            strategy = new MemberConfigStrategy(context, result);

            try {
                await strategy.setValue('member', 'ala');
            } catch (e) {
                expect(e.message).to.include('Provided role is invalid.');
                return;
            }

            chai.assert.fail('ConfigStrategy should throw an error');
        });

        it('should add member', async function () {

            context = new Context('', '', [], ['--role', 'guest']);
            strategy = new MemberConfigStrategy(context, result);

            const mock = sandbox.mock(strategy);
            mock.expects('addMember').once().resolves();

            const res = await strategy.setValue('member', 'ala@mako.ta');

            expect(res).to.be.a('string');
            mock.verify();
        });

        it('should throw http connection error durnig adding member', async function () {

            context = new Context('', '', [], ['--role', 'guest']);
            strategy = new MemberConfigStrategy(context, result);
            sandbox.stub(HttpWrapper.prototype, 'post').rejects(new Error('Fake error.'))

            try {
                await strategy.setValue('member', projectName);
            } catch (e) {
                expect(e.message).to.include('Fake error.');
                return;
            }

            chai.assert.fail('ConfigStrategy should throw an error');
        });

        it('should leave project', async function () {

            context = new Context('', '', [], ['--leave', 'true']);
            strategy = new MemberConfigStrategy(context, result);
            sandbox.stub(helpers, 'createTextPrompt').resolves(projectName);

            const mock = sandbox.mock(strategy);
            mock.expects('leaveProject').once().resolves();

            const res = await strategy.setValue('member', projectName);

            expect(res).to.be.a('string');
            mock.verify();
        });

        it('should throw error if provided wrong name', async function () {

            context = new Context('', '', [], ['--leave', 'true']);
            strategy = new MemberConfigStrategy(context, result);
            sandbox.stub(helpers, 'createTextPrompt').resolves('');

            try {
                await strategy.setValue('member', projectName);
            } catch (e) {
                expect(e.message).to.include('The names do not match.');
                return;
            }

            chai.assert.fail('ConfigStrategy should throw an error');
        });

        it('should throw error if invalid project name', async function () {

            context = new Context('', '', [], ['--leave', 'true']);
            strategy = new MemberConfigStrategy(context, result);
            sandbox.stub(context.mdbConfig, 'getValue').returns('?');

            try {
                await strategy.setValue('member', '');
            } catch (e) {
                expect(e.message).to.include('project name');
                return;
            }

            chai.assert.fail('ConfigStrategy should throw an error');
        });

        it('should throw http connection error durnig leaving project', async function () {

            context = new Context('', '', [], ['--leave', 'true']);
            strategy = new MemberConfigStrategy(context, result);
            sandbox.stub(helpers, 'createTextPrompt').resolves(projectName);
            sandbox.stub(HttpWrapper.prototype, 'delete').rejects(new Error('Fake error.'))

            try {
                await strategy.setValue('member', projectName);
            } catch (e) {
                expect(e.message).to.include('Fake error.');
                return;
            }

            chai.assert.fail('ConfigStrategy should throw an error');
        });

        it('should list project members', async function () {

            context = new Context('', '', [], ['--list', 'true']);
            strategy = new MemberConfigStrategy(context, result);
            sandbox.stub(HttpWrapper.prototype, 'get').resolves({ body: '[]' } as CustomOkResponse);

            const res = await strategy.setValue('member', projectName);

            expect(res).to.be.an('Array');
        });

        it('should list project members if name not provided', async function () {

            context = new Context('', '', [], ['--list', 'true']);
            strategy = new MemberConfigStrategy(context, result);
            sandbox.stub(HttpWrapper.prototype, 'get').resolves({ body: '[]' } as CustomOkResponse);
            sandbox.stub(context.mdbConfig, 'getValue').returns(projectName);

            const res = await strategy.setValue('member', '');

            expect(res).to.be.an('Array');
        });
    });

    describe('Method: unsetValue()', function () {

        it('should unset config value by email', async function () {

            context = new Context('', '', [], ['--unset']);
            strategy = new MemberConfigStrategy(context, result);

            const mock = sandbox.mock(strategy);
            mock.expects('removeMember').once().resolves();

            const res = await strategy.unsetValue('member', 'ala@mako.ta');

            expect(res).to.be.a('string');
            mock.verify();
        });

        it('should unset config value by username', async function () {

            context = new Context('', '', [], ['--unset']);
            strategy = new MemberConfigStrategy(context, result);

            const mock = sandbox.mock(strategy);
            mock.expects('removeMember').once().resolves();

            const res = await strategy.unsetValue('member', 'ala');

            expect(res).to.be.a('string');
            mock.verify();
        });

        it('should throw http connection error', async function () {

            context = new Context('', '', [], ['--unset']);
            strategy = new MemberConfigStrategy(context, result);
            sandbox.stub(HttpWrapper.prototype, 'delete').rejects(new Error('Fake error.'))

            try {
                await strategy.unsetValue('member', 'ala@mako.ta');
            } catch (e) {
                expect(e.message).to.include('Fake error.');
                return;
            }

            chai.assert.fail('ConfigStrategy should throw an error');
        });
    });
});
