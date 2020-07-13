'use strict';

const NpmPackageManager = require('../../utils/managers/npm-package-manager');
const PackageManager = require('../../utils/managers/package-manager');
const PackageManagers = require('../../models/package-managers');
const VersionHandler = require('../../utils/version-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');

describe('Handlers: Version', () => {

    let authHandler, handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new VersionHandler(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        handler = new VersionHandler();

        expect(handler).to.have.property('authHandler');
    });

    it('should load package manager', async () => {

        sandbox.stub(helpers, 'deserializeJsonFile').resolves({ packageManager: PackageManagers.NPM });

        await handler.loadPackageManager();

        expect(handler.packageManager).to.be.an.instanceOf(PackageManager);
    });

    it('should reject if error', async () => {

        const fakeError = new Error('fakeError');
        handler.packageManager = new NpmPackageManager();
        const fakeReturnedStream = { on(event = 'error', cb) { if (event === 'error') cb(fakeError); } };
        sandbox.stub(handler.packageManager, 'info').returns(fakeReturnedStream);

        try{

            await handler.printVersion();
        } 
        catch(err) {

            expect(err.message).to.be.equal(fakeError.message);
        }
    });
});
