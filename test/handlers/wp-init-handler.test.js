'use strict';

const WpInitHandler = require('../../utils/wp-init-handler');
const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const config = require('../../config');
const inquirer = require('inquirer');
const fs = require('fs');

describe('Handler: WpInit', () => {

    let handler,
        authHandler;

    beforeEach(() => {

        sandbox.stub(config, 'wpPageTypes').value(['blog', 'ecommerce', 'blog+ecommerce']);
        sandbox.stub(AuthHandler.prototype, 'setAuthHeader');
        sandbox.stub(AuthHandler.prototype, 'checkForAuth');
        authHandler = new AuthHandler(true);
        handler = new WpInitHandler(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler if not specified in constructor', () => {

        handler = new WpInitHandler();

        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should getResult return handler result', () => {

        const expectedResult = { Status: 200, Message: 'Success' };
        sandbox.stub(handler, 'result').value([expectedResult]);

        const result = handler.getResult();

        expect(result).to.deep.include(expectedResult);
    });

    it('should setArgs show list if incorrect value provided in args', async () => {

        const pageType = 'blog';
        const promptStub = sandbox.stub().resolves({ name: pageType });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        await handler.setArgs(['--type=asdf']);

        expect(handler.pageType).to.be.equal(pageType);
    });

    it('should set pageType property', async () => {

        expect(handler.pageType).to.be.eq(undefined);

        await handler.setArgs(['--type', 'blog']);

        expect(handler.pageType).to.be.eq('blog');
    });

    it('should set pageType property if provided with equal sign', async () => {

        expect(handler.pageType).to.be.eq(undefined);

        await handler.setArgs(['--type=ecommerce']);

        expect(handler.pageType).to.be.eq('ecommerce');
    });

    describe('Method: eraseDirectories', () => {

        let existsSyncStub,
            showConfirmationPromptStub,
            removeFolderStub;

        beforeEach(() => {

            sandbox.stub(handler, 'cwd').value('fake/cwd');
            sandbox.stub(handler, 'pageType').value('fakePageType');
            sandbox.stub(helpers, 'getThemeName').returns('fakeThemeName');
            showConfirmationPromptStub = sandbox.stub(helpers, 'showConfirmationPrompt');
            removeFolderStub = sandbox.stub(helpers, 'removeFolder');
            existsSyncStub = sandbox.stub(fs, 'existsSync');
        });

        it('should resolve immediately if theme directory does not exist', async () => {

            existsSyncStub.returns(false);

            await handler.eraseDirectories();

            sandbox.assert.notCalled(showConfirmationPromptStub);
            sandbox.assert.notCalled(removeFolderStub);
        });

        it('should reject if user does not confirm deletion', async () => {

            existsSyncStub.returns(true);
            showConfirmationPromptStub.resolves(false);
            const expectedResult = { Status: 0, Message: 'OK, will not delete existing theme.' };

            try {

                await handler.eraseDirectories();
            } catch (err) {

                expect(err).to.deep.include(expectedResult);
                sandbox.assert.calledOnce(showConfirmationPromptStub);
                sandbox.assert.notCalled(removeFolderStub);
            }
        });

        it('should delete the theme folder if user confirms deletion', async () => {

            existsSyncStub.returns(true);
            showConfirmationPromptStub.resolves(true);
            removeFolderStub.resolves();

            await handler.eraseDirectories();

            sandbox.assert.calledOnce(showConfirmationPromptStub);
            sandbox.assert.calledOnce(removeFolderStub);
        });
    });

    describe('Method: downloadTheme', () => {

        let downloadStub;

        beforeEach(() => {

            sandbox.stub(handler, 'cwd').value('fake/cwd');
            sandbox.stub(handler, 'pageType').value('fakePageType');
            sandbox.stub(handler, 'saveMetadata').resolves();
            downloadStub = sandbox.stub(helpers, 'downloadFromFTP').resolves();
        });

        it('should download wordpress theme', async () => {
    
            await handler.downloadTheme();
    
            sandbox.assert.calledOnce(downloadStub);
            expect(handler.options.path).to.be.eq('/packages/wordpress/fakePageType');
        });

        it('should download wordpress theme if --free flag', async () => {
    
            sandbox.stub(handler, 'freeTheme').value(true);

            await handler.downloadTheme();
    
            sandbox.assert.calledOnce(downloadStub);
            expect(handler.options.path).to.be.eq('/packages/wordpress/fakePageType?free=true');
        });
    });


    describe('Method: saveMetadata', () => {

        let existsSyncStub,
            writeFileSyncStub,
            deserializeJsonFileStub,
            serializeJsonFileStub;

        beforeEach(() => {

            existsSyncStub = sandbox.stub(fs, 'existsSync');
            writeFileSyncStub = sandbox.stub(fs, 'writeFileSync');
            deserializeJsonFileStub = sandbox.stub(helpers, 'deserializeJsonFile');
            serializeJsonFileStub = sandbox.stub(helpers, 'serializeJsonFile');
            sandbox.stub(handler, 'themePath').value('fake/path');
        });

        it('should save metadata if config file exists', async () => {

            existsSyncStub.returns(true);
            deserializeJsonFileStub.resolves({});
            serializeJsonFileStub.resolves();

            await handler.saveMetadata({ name: 'fakeName' });

            sandbox.assert.callOrder(existsSyncStub, deserializeJsonFileStub, serializeJsonFileStub);
            sandbox.assert.notCalled(writeFileSyncStub);
        });

        it('should save metadata if config file does not exist', async () => {

            existsSyncStub.returns(false);

            await handler.saveMetadata({ name: 'fakeName' });

            sandbox.assert.callOrder(existsSyncStub, writeFileSyncStub);
            sandbox.assert.notCalled(deserializeJsonFileStub);
            sandbox.assert.notCalled(serializeJsonFileStub);
        });
    });
});
