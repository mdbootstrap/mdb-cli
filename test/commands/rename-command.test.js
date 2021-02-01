'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const RenameCommand = require('../../commands/rename-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const FrontendReceiver = require('../../receivers/frontend-receiver');
const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');


describe('Command: rename', () => {

    let command, context;

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('should set correct receiver', () => {

        it('if entity is backend', () => {

            context = new Context('backend', 'rename', '', []);
            command = new RenameCommand(context);

            expect(command.receiver).to.be.an.instanceOf(BackendReceiver);
            expect(command.receiver.context.entity).to.be.eq('backend');
        });

        it('if entity is frontend', () => {

            context = new Context('frontend', 'rename', '', []);
            command = new RenameCommand(context);

            expect(command.receiver).to.be.an.instanceOf(FrontendReceiver);
            expect(command.receiver.context.entity).to.be.eq('frontend');
        });

        it('if entity is undefined', () => {

            context = new Context('', 'rename', '', []);
            sandbox.stub(context.mdbConfig, 'getValue').withArgs('meta.type').returns(undefined);
            command = new RenameCommand(context);

            expect(command.receiver).to.be.an.instanceOf(FrontendReceiver);
            expect(command.receiver.context.entity).to.be.eq('frontend');
        });

        it('if entity is undefined but backend type is saved in config', () => {

            context = new Context('', 'rename', '', []);
            sandbox.stub(context.mdbConfig, 'getValue').withArgs('meta.type').returns('backend');
            command = new RenameCommand(context);

            expect(command.receiver).to.be.an.instanceOf(BackendReceiver);
            expect(command.receiver.context.entity).to.be.eq('backend');
        });

        it('if entity is undefined but frontend type is saved in config', () => {

            context = new Context('', 'rename', '', []);
            sandbox.stub(context.mdbConfig, 'getValue').withArgs('meta.type').returns('frontend');
            command = new RenameCommand(context);

            expect(command.receiver).to.be.an.instanceOf(FrontendReceiver);
            expect(command.receiver.context.entity).to.be.eq('frontend');
        });
    });

    describe('execution', () => {

        let printResultStub, deleteStub, publishStub, renameStub, promptStub;

        beforeEach(() => {

            promptStub = sandbox.stub(helpers, 'createConfirmationPrompt');
            printResultStub = sandbox.stub(Command.prototype, 'printResult');
            context = new Context('backend', 'rename', '', []);
            command = new RenameCommand(context);
            sandbox.stub(command.receiver, 'getProjectName').returns('fake-name');
            deleteStub = sandbox.stub(command.receiver, 'delete');
            renameStub = sandbox.stub(command.receiver, 'rename');
            publishStub = sandbox.stub(command.receiver, 'publish');

        });

        it('should rename project', async () => {

            promptStub.resolves(true);
            deleteStub.resolves(true);
            renameStub.resolves(true);
            publishStub.resolves();

            await command.execute();

            sandbox.assert.calledOnceWithExactly(deleteStub, 'fake-name');
            sandbox.assert.calledOnce(renameStub);
            sandbox.assert.calledOnce(publishStub);
            sandbox.assert.calledThrice(printResultStub);
        });

        it('should abort if user does not confirm', async () => {

            promptStub.resolves(false);

            await command.execute();

            sandbox.assert.notCalled(deleteStub);
            sandbox.assert.notCalled(renameStub);
            sandbox.assert.notCalled(publishStub);
            sandbox.assert.notCalled(printResultStub);
        });

        it('should abort if deletion fails', async () => {

            promptStub.resolves(true);
            deleteStub.resolves(false);

            await command.execute();

            sandbox.assert.calledOnceWithExactly(deleteStub, 'fake-name');
            sandbox.assert.notCalled(renameStub);
            sandbox.assert.notCalled(publishStub);
            sandbox.assert.calledOnce(printResultStub);
        });

        it('should abort if rename fails', async () => {

            promptStub.resolves(true);
            deleteStub.resolves(true);
            renameStub.resolves(false);

            await command.execute();

            sandbox.assert.calledOnceWithExactly(deleteStub, 'fake-name');
            sandbox.assert.calledOnce(renameStub);
            sandbox.assert.notCalled(publishStub);
            sandbox.assert.calledTwice(printResultStub);
        });
    });
});