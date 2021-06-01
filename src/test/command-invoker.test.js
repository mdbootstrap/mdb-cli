'use strict';

const CommandInvoker = require('../command-invoker');
const sandbox = require('sinon').createSandbox();

describe('CommandInvoker', () => {

    let invoker;

    beforeEach(() => {
        invoker = new CommandInvoker();
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    it('should create a proper command and pass entity, arg & flags', async function () {
        const HelpCommand = require('../commands/help-command');
        const stub = sandbox.stub(HelpCommand.prototype, 'execute');

        invoker.entity = 'app';
        invoker.command = 'help';

        await invoker.executeCommand();

        expect(stub).to.have.been.calledOnce;
    });

    it('should execute help command if user doesn\'t provide any argument', async function () {
        const HelpCommand = require('../commands/help-command');
        const stub = sandbox.stub(HelpCommand.prototype, 'execute');

        await invoker.parse(['', 'mdb']);
        await invoker.executeCommand();

        expect(stub).to.have.been.calledOnce;
    });

    it('should throw error if flag contain `=` instead of space', function () {

        try {
            invoker.parse(['', 'mdb', 'login', '--method=google']);
        } catch (e) {
            return expect(e.message).to.be.eq('Please use space instead of `=` on flags');
        }

        chai.assert.fail('_isFlag function should throw error if flag contain `=`');
    });

    describe('should properly parse entity, command, arg and flags', function () {

        it('mdb help', function () {
            invoker.parse(['', 'mdb', 'help']);

            expect(invoker.entity).to.eq('app');
            expect(invoker.command).to.eq('help');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb version', function () {

            invoker.parse(['', 'mdb', 'version']);

            expect(invoker.entity).to.eq('app');
            expect(invoker.command).to.eq('version');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb -v', function () {

            invoker.parse(['', 'mdb', '-v']);

            expect(invoker.entity).to.eq('app');
            expect(invoker.command).to.eq('version');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb --version', function () {

            invoker.parse(['', 'mdb', '--version']);

            expect(invoker.entity).to.eq('app');
            expect(invoker.command).to.eq('version');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb update', function () {

            invoker.parse(['', 'mdb', 'update']);

            expect(invoker.entity).to.eq('app');
            expect(invoker.command).to.eq('update');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb register', function () {

            invoker.parse(['', 'mdb', 'register']);

            expect(invoker.entity).to.eq('user');
            expect(invoker.command).to.eq('register');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb login', function () {

            invoker.parse(['', 'mdb', 'login']);

            expect(invoker.entity).to.eq('user');
            expect(invoker.command).to.eq('login');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb logout', function () {

            invoker.parse(['', 'mdb', 'logout']);

            expect(invoker.entity).to.eq('user');
            expect(invoker.command).to.eq('logout');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb starters', function () {

            invoker.parse(['', 'mdb', 'starters']);

            expect(invoker.entity).to.eq('starter');
            expect(invoker.command).to.eq('ls');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb starter ls', function () {

            invoker.parse(['', 'mdb', 'starter', 'ls']);

            expect(invoker.entity).to.eq('starter');
            expect(invoker.command).to.eq('ls');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb starter init', function () {

            invoker.parse(['', 'mdb', 'starter', 'init']);

            expect(invoker.entity).to.eq('starter');
            expect(invoker.command).to.eq('init');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb backend init', function () {

            invoker.parse(['', 'mdb', 'backend', 'init']);

            expect(invoker.entity).to.eq('backend');
            expect(invoker.command).to.eq('init');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb frontend init', function () {

            invoker.parse(['', 'mdb', 'frontend', 'init']);

            expect(invoker.entity).to.eq('frontend');
            expect(invoker.command).to.eq('init');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb blank init', function () {

            invoker.parse(['', 'mdb', 'blank', 'init']);

            expect(invoker.entity).to.eq('blank');
            expect(invoker.command).to.eq('init');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb repo init', function () {

            invoker.parse(['', 'mdb', 'repo', 'init']);

            expect(invoker.entity).to.eq('repo');
            expect(invoker.command).to.eq('init');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb config domain newname', function () {

            invoker.parse(['', 'mdb', 'config', 'domain', 'newname']);

            expect(invoker.entity).to.eq('config');
            expect(invoker.command).to.eq('config');
            expect(invoker.args).to.deep.eq(['domain', 'newname']);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb config domain --unset', function () {

            invoker.parse(['', 'mdb', 'config', 'domain', '--unset']);

            expect(invoker.entity).to.eq('config');
            expect(invoker.command).to.eq('config');
            expect(invoker.args).to.deep.eq(['domain']);
            expect(invoker.flags).to.deep.eq(['--unset']);
        });

        it('mdb publish', function () {

            invoker.parse(['', 'mdb', 'publish']);

            expect(invoker.entity).to.eq('');
            expect(invoker.command).to.eq('publish');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb publish -t --ftp', function () {

            invoker.parse(['', 'mdb', 'publish', '-t', '--ftp']);

            expect(invoker.entity).to.eq('');
            expect(invoker.command).to.eq('publish');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq(['-t', '--ftp']);
        });

        it('mdb frontend publish', function () {

            invoker.parse(['', 'mdb', 'frontend', 'publish']);

            expect(invoker.entity).to.eq('frontend');
            expect(invoker.command).to.eq('publish');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb backend publish', function () {

            invoker.parse(['', 'mdb', 'backend', 'publish']);

            expect(invoker.entity).to.eq('backend');
            expect(invoker.command).to.eq('publish');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb frontend publish -t --ftp', function () {

            invoker.parse(['', 'mdb', 'frontend', 'publish', '-t', '--ftp']);

            expect(invoker.entity).to.eq('frontend');
            expect(invoker.command).to.eq('publish');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq(['-t', '--ftp']);
        });

        it('mdb delete', function () {

            invoker.parse(['', 'mdb', 'delete']);

            expect(invoker.entity).to.eq('');
            expect(invoker.command).to.eq('delete');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb frontend delete', function () {

            invoker.parse(['', 'mdb', 'frontend', 'delete']);

            expect(invoker.entity).to.eq('frontend');
            expect(invoker.command).to.eq('delete');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb backend delete', function () {

            invoker.parse(['', 'mdb', 'backend', 'delete']);

            expect(invoker.entity).to.eq('backend');
            expect(invoker.command).to.eq('delete');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb ls', function () {

            invoker.parse(['', 'mdb', 'ls']);

            expect(invoker.entity).to.eq('');
            expect(invoker.command).to.eq('ls');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb frontend ls', function () {

            invoker.parse(['', 'mdb', 'frontend', 'ls']);

            expect(invoker.entity).to.eq('frontend');
            expect(invoker.command).to.eq('ls');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb backend ls', function () {

            invoker.parse(['', 'mdb', 'backend', 'ls']);

            expect(invoker.entity).to.eq('backend');
            expect(invoker.command).to.eq('ls');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb database ls', function () {

            invoker.parse(['', 'mdb', 'database', 'ls']);

            expect(invoker.entity).to.eq('database');
            expect(invoker.command).to.eq('ls');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb get', function () {

            invoker.parse(['', 'mdb', 'get']);

            expect(invoker.entity).to.eq('');
            expect(invoker.command).to.eq('get');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb orders', function () {

            invoker.parse(['', 'mdb', 'orders']);

            expect(invoker.entity).to.eq('order');
            expect(invoker.command).to.eq('ls');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb order ls', function () {

            invoker.parse(['', 'mdb', 'order', 'ls']);

            expect(invoker.entity).to.eq('order');
            expect(invoker.command).to.eq('ls');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb database info', function () {

            invoker.parse(['', 'mdb', 'database', 'info']);

            expect(invoker.entity).to.eq('database');
            expect(invoker.command).to.eq('info');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb database delete', function () {

            invoker.parse(['', 'mdb', 'database', 'delete']);

            expect(invoker.entity).to.eq('database');
            expect(invoker.command).to.eq('delete');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb backend kill', function () {

            invoker.parse(['', 'mdb', 'backend', 'kill']);

            expect(invoker.entity).to.eq('backend');
            expect(invoker.command).to.eq('kill');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb backend destroy', function () {

            invoker.parse(['', 'mdb', 'backend', 'destroy']);

            expect(invoker.entity).to.eq('backend');
            expect(invoker.command).to.eq('destroy');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb backend info', function () {

            invoker.parse(['', 'mdb', 'backend', 'info']);

            expect(invoker.entity).to.eq('backend');
            expect(invoker.command).to.eq('info');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb backend logs', function () {

            invoker.parse(['', 'mdb', 'backend', 'logs']);

            expect(invoker.entity).to.eq('backend');
            expect(invoker.command).to.eq('logs');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb rename', function () {

            invoker.parse(['', 'mdb', 'rename']);

            expect(invoker.entity).to.eq('');
            expect(invoker.command).to.eq('rename');
            expect(invoker.args).to.deep.eq([]);
            expect(invoker.flags).to.deep.eq([]);
        });

        it('mdb rename newname', function () {

            invoker.parse(['', 'mdb', 'rename', 'newname']);

            expect(invoker.entity).to.eq('');
            expect(invoker.command).to.eq('rename');
            expect(invoker.args).to.deep.eq(['newname']);
            expect(invoker.flags).to.deep.eq([]);
        });
    });
});
