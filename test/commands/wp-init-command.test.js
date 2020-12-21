'use strict';

const WpInitCommand = require('../../commands/wp-init-command');
const WpInitHandler = require('../../utils/wp-init-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: wp-init', () => {

    let authHandler,
        command,
        setArgsStub,
        eraseDirectoriesStub,
        downloadThemeStub,
        printStub,
        catchErrorStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new WpInitCommand(authHandler);
        setArgsStub = sandbox.stub(command.handler, 'setArgs');
        eraseDirectoriesStub = sandbox.stub(command.handler, 'eraseDirectories');
        downloadThemeStub = sandbox.stub(command.handler, 'downloadTheme');
        printStub = sandbox.stub(command, 'print');
        catchErrorStub = sandbox.stub(command, 'catchError');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(WpInitHandler);
    });

    it('should have assigned authHandler', () => {

        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');

        command = new WpInitCommand();

        expect(command).to.have.property('authHandler');
        expect(command.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should call handler methods in expected order', async () => {

        setArgsStub.resolves();
        eraseDirectoriesStub.resolves();
        downloadThemeStub.resolves();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, eraseDirectoriesStub, downloadThemeStub, printStub);
        sandbox.assert.notCalled(catchErrorStub);
    });

    it('should call handler methods in expected order if error', async () => {

        setArgsStub.resolves();
        eraseDirectoriesStub.resolves();
        downloadThemeStub.rejects();

        await command.execute();

        sandbox.assert.callOrder(setArgsStub, eraseDirectoriesStub, downloadThemeStub, catchErrorStub);
        sandbox.assert.notCalled(printStub);
    });
});