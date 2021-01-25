'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const PublishCommand = require('../../commands/publish-command');
const FrontendReceiver = require('../../receivers/frontend-receiver');
const BackendReceiver = require('../../receivers/backend-receiver');
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

        const configStub = sandbox.stub(FrontendReceiver.prototype, 'publish');
        const context = new Context('frontend', 'publish', '', []);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(configStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call backend receiver publish() method and print result', async () => {

        const configStub = sandbox.stub(BackendReceiver.prototype, 'publish');
        const context = new Context('backend', 'publish', '', []);
        const command = new PublishCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(configStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });
});
