'use strict';

const NpmPackageManager = require('../../utils/managers/npm-package-manager');
const PackageManager = require('../../utils/managers/package-manager');
const PackageManagers = require('../../models/package-managers');
const UpdateHandler = require('../../utils/update-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');

describe('Handlers: Update', () => {

    let authHandler, handler;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        handler = new UpdateHandler(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        handler = new UpdateHandler();

        expect(handler).to.have.property('authHandler');
    });

    it('should load package manager', async () => {

        sandbox.stub(helpers, 'deserializeJsonFile').resolves({ packageManager: PackageManagers.NPM });

        await handler.loadPackageManager();

        expect(handler.packageManager).to.be.an.instanceOf(PackageManager);
    });

    it('should getResult method return an array', () => {

        const result = handler.getResult();

        expect(result).to.be.an('array');
        expect(result).to.equal(handler.result);
    });

    it('should update CLI and set handler result if code is 0', async () => {

        const code = 0;
        handler.packageManager = new NpmPackageManager();
        const fakeReturnedStream = { on(event = 'exit', cb) { if (event === 'exit') cb(code); } };
        sandbox.stub(handler.packageManager, 'update').returns(fakeReturnedStream);
        const expectedResult = { Status: code, Message: 'Success' };

        await handler.update();

        expect(handler.result).to.deep.include(expectedResult);
    });

    it('should reject if code is not equal to 0', async () => {

        const code = 1;
        handler.packageManager = new NpmPackageManager();
        const fakeReturnedStream = { on(event = 'exit', cb) { if (event === 'exit') cb(code); } };
        sandbox.stub(handler.packageManager, 'update').returns(fakeReturnedStream);
        const expectedResult = { Status: code, Message: 'There were some errors. Please try again.' };

        try{

            await handler.update();
        } 
        catch(err) {

            expect(err).to.deep.include(expectedResult);
        }
    });

    it('should reject if error', async () => {

        const fakeError = new Error('fakeError');
        handler.packageManager = new NpmPackageManager();
        const fakeReturnedStream = { on(event = 'error', cb) { if (event === 'error') cb(fakeError); } };
        sandbox.stub(handler.packageManager, 'update').returns(fakeReturnedStream);

        try{

            await handler.update();
        } 
        catch(err) {

            expect(err).to.be.equal(fakeError);
        }
    });
});