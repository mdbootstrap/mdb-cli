'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const PublishCommand = require('../../commands/publish-command');
const FrontendReceiver = require('../../receivers/frontend-receiver');
const BackendReceiver = require('../../receivers/backend-receiver');
const WordpressReceiver = require('../../receivers/wordpress-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: publish', () => {

    let printResultStub;

    beforeEach(() => {

        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call frontend receiver publish() method and print result', async () => {

        const publishStub = sandbox.stub(FrontendReceiver.prototype, 'publish');
        const context = new Context('frontend', 'publish', '', []);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(publishStub);
        expect(command.receiver.context.entity).to.be.eq('frontend');
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call backend receiver publish() method and print result', async () => {

        const publishStub = sandbox.stub(BackendReceiver.prototype, 'publish');
        const context = new Context('backend', 'publish', '', []);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(publishStub);
        expect(command.receiver.context.entity).to.be.eq('backend');
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call wordpress receiver publish() method and print result', async () => {

        const publishStub = sandbox.stub(WordpressReceiver.prototype, 'publish');
        const context = new Context('wordpress', 'publish', '', []);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(publishStub);
        expect(command.receiver.context.entity).to.be.eq('wordpress');
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call frontend receiver publish() method and print result if entity is undefined', async () => {

        const publishStub = sandbox.stub(FrontendReceiver.prototype, 'publish');
        const context = new Context('', 'publish', '', []);
        sandbox.stub(context.mdbConfig, 'getValue').withArgs('meta.type').returns(undefined);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(publishStub);
        expect(command.receiver.context.entity).to.be.eq('frontend');
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call backend receiver publish() method and print result if entity is undefined but saved in config', async () => {

        const publishStub = sandbox.stub(BackendReceiver.prototype, 'publish');
        const context = new Context('', 'publish', '', []);
        sandbox.stub(context.mdbConfig, 'getValue').withArgs('meta.type').returns('backend');
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(publishStub);
        expect(command.receiver.context.entity).to.be.eq('backend');
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call help method and print result if --help flag is used', async () => {

        const helpSpy = sandbox.spy(PublishCommand.prototype, 'help');
        const context = new Context('', 'publish', '', ['-h']);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
