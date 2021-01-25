'use strict';

const fs = require('fs');
const Context = require('../context');
const DotMdbConfigManager = require('../utils/managers/dot-mdb-config-manager');
const PackageManagers = require('../models/package-managers');
const NpmPackageManager = require('../utils/managers/npm-package-manager');

const config = require('../config');

const sandbox = require('sinon').createSandbox();

describe('Context', () => {

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    it('should have all fields set up correctly', function () {
        sandbox.stub(Context.prototype, '_loadPackageJsonConfig');

        const entity = 'testEntity';
        const command = 'testCommand';
        const args = ['test', 'args'];
        const flags = ['test', 'flags'];
        const context = new Context(entity, command, args, flags);

        expect(context.userToken).to.eq('');
        expect(context.mdbConfig).to.be.an.instanceOf(DotMdbConfigManager);
        expect(context.packageJsonConfig).to.be.an('object').that.is.empty;
        expect(context.packageManager).to.be.null;
        expect(context.entity).to.eq(entity);
        expect(context.command).to.eq(command);
        expect(context.args).to.deep.eq(args);
        expect(context.rawFlags).to.deep.eq(flags);
        expect([...context._nonArgFlags.values()]).to.deep.eq(['all', 'force', 'help']);
        expect([...context._flagExpansions.entries()]).to.deep.eq([['-h', '--help'], ['-a', '--all'], ['-f', '--force']]);
    });

    describe('should parse flags correctly', function () {
        beforeEach(() => {
            sandbox.stub(Context.prototype, '_loadPackageJsonConfig');
        });

        it('with flags provided: -a --test --method ftp', function () {

            const expected = {
                all: true,
                test: true,
                method: 'ftp'
            };

            const context = new Context('', '', [], ['-a', '--test', '--method', 'ftp']);
            context.registerNonArgFlags(['test']);

            const result = context.getParsedFlags();

            expect(result).to.deep.eq(expected);
        });

        it('with flags provided: -h', function () {

            const expected = {
                help: true
            };

            const context = new Context('', '', [], ['-h']);

            const result = context.getParsedFlags();

            expect(result).to.deep.eq(expected);
        });

        it('with flags provided: --force', function () {

            const expected = {
                force: true
            };

            const context = new Context('', '', [], ['--force']);

            const result = context.getParsedFlags();

            expect(result).to.deep.eq(expected);
        });

        it('with flags provided: invalidflag --ftp', function (done) {

            const context = new Context('', '', [], ['invalidflag', '--ftp']);

            try {
                context.getParsedFlags();
            } catch (e) {
                expect(e.message.toLowerCase()).to.include('unknown flag');
                return done();
            }

            chai.assert.fail('Context should fail parsing invalid flags');
        });

        it('with flags provided: -a invalid value', function (done) {

            const context = new Context('', '', [], ['-a', 'invalid', 'value']);

            try {
                context.getParsedFlags();
            } catch (e) {
                expect(e.message.toLowerCase()).to.include('unknown flag');
                return done();
            }

            chai.assert.fail('Context should fail parsing invalid flags');
        });
    });

    it('should register non-arg flags', function () {
        sandbox.stub(Context.prototype, '_loadPackageJsonConfig');

        const context = new Context('', '', [], []);
        context.registerNonArgFlags(['fakeflag']);

        expect([...context._nonArgFlags.values()]).to.include('fakeflag');
    });

    it('should throw error in registerNonArgFlags() if no non-arg flags provided', function (done) {
        sandbox.stub(Context.prototype, '_loadPackageJsonConfig');

        const context = new Context('', '', [], []);

        try {
            context.registerNonArgFlags([]);
        } catch (e) {
            return done();
        }

        chai.assert.fail('registerNonArgFlags() should fail when no non-arg flags provided');
    });

    it('should register flag expansions', function () {
        sandbox.stub(Context.prototype, '_loadPackageJsonConfig');

        const context = new Context('', '', [], []);
        context.registerFlagExpansions({ '-fake': '--fakeExpansion' });

        expect([...context._flagExpansions.entries()]).to.deep.include(['-fake', '--fakeExpansion']);
    });

    it('should throw error in registerFlagExpansions() if no flag expansions provided', function (done) {
        sandbox.stub(Context.prototype, '_loadPackageJsonConfig');

        const context = new Context('', '', [], []);

        try {
            context.registerFlagExpansions({});
        } catch (e) {
            return done();
        }

        chai.assert.fail('registerFlagExpansions() should fail when no flag expansions provided');
    });

    it('should authenticateUser() without errors', function () {
        sandbox.stub(Context.prototype, '_loadPackageJsonConfig');

        const fakeToken = 'faketoken';

        sandbox.replace(config, 'tokenDir', '');
        sandbox.replace(config, 'tokenFile', '');
        sandbox.stub(fs, 'readFileSync').returns(fakeToken);

        const context = new Context('', '', [], []);
        context.authenticateUser();

        expect(context.userToken).to.eq(fakeToken);
    });

    it('should throw error in authenticateUser()', function (done) {
        sandbox.stub(Context.prototype, '_loadPackageJsonConfig');

        const fakeError = new Error('fake error');
        sandbox.replace(config, 'tokenDir', '');
        sandbox.replace(config, 'tokenFile', '');
        sandbox.stub(fs, 'readFileSync').throws(fakeError);

        try {
            const context = new Context('', '', [], []);
            context.authenticateUser();
        } catch (e) {
            return done();
        }

        chai.assert.fail('Context should fail authenticating user');
    });

    it('should load package manager if not loaded already', async function () {
        sandbox.stub(Context.prototype, '_loadPackageJsonConfig');

        const context = new Context('', '', [], []);
        context.packageManager = null;
        context.mdbConfig.mdbConfig.packageManager = PackageManagers.NPM;

        await context.loadPackageManager();

        expect(context.packageManager).to.be.an.instanceOf(NpmPackageManager);
    });

    it('should should not re-load package manager if already loaded', async function () {
        sandbox.stub(Context.prototype, '_loadPackageJsonConfig');

        const context = new Context('', '', [], []);
        context.packageManager = new NpmPackageManager();
        context.mdbConfig.mdbConfig.packageManager = PackageManagers.YARN;

        await context.loadPackageManager();

        expect(context.packageManager).to.be.an.instanceOf(NpmPackageManager);
    });

    it('should load package.json config if exists', function () {

        const fakePackageJson = JSON.stringify({ key: 'value' });

        sandbox.stub(fs, 'readFileSync').returns(fakePackageJson);

        const context = new Context('', '', [], []);

        expect(context.packageJsonConfig).to.deep.eq(JSON.parse(fakePackageJson));
    });

    it('should not load package.json if the file does not exist', function () {

        const fakeError = new Error('fake error');
        sandbox.stub(fs, 'readFileSync').throws(fakeError);

        const context = new Context('', '', [], []);

        expect(context.packageJsonConfig).to.be.an('object').that.is.empty;
    });
});
