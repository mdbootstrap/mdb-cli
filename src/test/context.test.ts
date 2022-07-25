import config from '../config';
import Context from '../context';
import { PackageManagers } from '../models/package-managers';
import NpmPackageManager from '../utils/managers/npm-package-manager';
import DotMdbConfigManager from '../utils/managers/dot-mdb-config-manager';
import { createSandbox } from 'sinon';
import { expect } from 'chai';
import fs from 'fs';

describe('Context', () => {

    const sandbox = createSandbox();

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
        // @ts-ignore
        expect(context._nonArgFlags).to.deep.eq(new Set(['all', 'force', 'help']));
        // @ts-ignore
        expect(context._flagExpansions).to.deep.eq(new Map([['-h', '--help'], ['-a', '--all'], ['-f', '--force']]));
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

        it('with flags provided: -a -s', function (done) {

            const context = new Context('', '', [], ['-a', '-s']);

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

        // @ts-ignore
        expect(context._nonArgFlags.has('fakeflag')).to.be.true;
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

        // @ts-ignore
        expect(context._flagExpansions.get('-fake')).to.be.eq('--fakeExpansion');
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
        sandbox.stub(Context.prototype, '_isTokenExpired').returns(false);

        const fakeToken = 'faketoken';

        sandbox.replace(config, 'tokenDir', '');
        sandbox.replace(config, 'tokenFile', '');
        sandbox.stub(fs, 'readFileSync').returns(fakeToken);

        const context = new Context('', '', [], []);
        context.authenticateUser();

        expect(context.userToken).to.eq(fakeToken);
    });

    it('should throw error in authenticateUser() if token does not exist', function (done) {
        sandbox.stub(Context.prototype, '_loadPackageJsonConfig');

        const fakeError = new Error('fake error');
        sandbox.replace(config, 'tokenDir', '');
        sandbox.replace(config, 'tokenFile', '');
        sandbox.stub(fs, 'readFileSync').throws(fakeError);

        try {
            const context = new Context('', '', [], []);
            context.authenticateUser();
        } catch (e) {
            expect(e.message).to.be.eq('Please login first');
            return done();
        }

        chai.assert.fail('Context should fail authenticating user');
    });

    it('should throw error in authenticateUser() if token is expired', function (done) {
        sandbox.stub(Context.prototype, '_loadPackageJsonConfig');

        sandbox.replace(config, 'tokenDir', '');
        sandbox.replace(config, 'tokenFile', '');
        sandbox.stub(fs, 'readFileSync').returns('a.eyJhIjoiYSIsImlhdCI6MTYzOTAzOTk1NiwiZXhwIjoxNjM5MDM5OTU3fQ.a');
        sandbox.stub(fs, 'unlinkSync');

        const context = new Context('', '', [], []);

        try {
            context.authenticateUser();
        } catch (e) {
            expect(context.userToken).to.eq('');
            expect(e.message).to.be.eq('Please login first');
            return done();
        }

        chai.assert.fail('Context should fail authenticating user');
    });

    it('should throw error in authenticateUser() if token is invalid', function (done) {
        sandbox.stub(Context.prototype, '_loadPackageJsonConfig');

        sandbox.replace(config, 'tokenDir', '');
        sandbox.replace(config, 'tokenFile', '');
        sandbox.stub(fs, 'readFileSync').returns('xxx');
        sandbox.stub(fs, 'unlinkSync');

        const context = new Context('', '', [], []);

        try {
            context.authenticateUser();
        } catch (e) {
            expect(context.userToken).to.eq('');
            expect(e.message).to.be.eq('Please login first');
            return done();
        }

        chai.assert.fail('Context should fail authenticating user');
    });

    it('should throw error with info about limit in authorizeUser() if user reached projects limit', async () => {
        const userPlan = {
            planId: 1,
            planName: 'Hobby',
            stripePlanId: '12345',
            price: 100,
            bytesContainerRamLimit: 500,
            bytesFtpLimit: 500,
            bytesDatabaseLimit: 500,
            countProjectsLimit: 1,
            countDatabasesLimit: 0
        };
        const userPermissions = ['fake_permission'];
        const projectsCount = 2;
        const userPlanData = { userPlan, userPermissions, projectsCount };

        const context = new Context('', '', [], []);
        sandbox.stub(Context.prototype, '_getSubscriptionPlanData').resolves(userPlanData);

        try {
            await context.authorizeUser();
        } catch (e) {
            return expect(e.message).to.include(`The maximum number of projects allowed for your account is ${userPlan.countProjectsLimit}`);
        }

        chai.assert.fail('Context should fail authorizing user');
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

    it('should set package.json value', function () {

        const fakePackageJson = JSON.stringify({ key: 'value' });
        sandbox.stub(fs, 'readFileSync').returns(fakePackageJson);
        const writeStub = sandbox.stub(fs, 'writeFileSync');
        const context = new Context('', '', [], []);

        context.setPackageJsonValue('name', 'test');

        sandbox.assert.calledOnce(writeStub);
    });

    it('should not set package.json value if error', function () {

        const fakePackageJson = JSON.stringify({ key: 'value' });
        sandbox.stub(fs, 'readFileSync').returns(fakePackageJson);
        sandbox.stub(fs, 'writeFileSync').throws(new Error('fake error'));
        const context = new Context('', '', [], []);

        try {
            context.setPackageJsonValue('name', 'test');
        } catch (e) {
            return;
        }

        chai.assert.fail('setPackageJsonValue() should fail');
    });
});
