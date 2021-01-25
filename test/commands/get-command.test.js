'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const GetCommand = require('../../commands/get-command');
const BackendReceiver = require('../../receivers/backend-receiver');
const FrontendReceiver = require('../../receivers/frontend-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: get', () => {

    let command, context, getStub, printResultStub;

    beforeEach(() => {

        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call backend receiver get method and print result if entity is backend', async () => {

        getStub = sandbox.stub(BackendReceiver.prototype, 'get');
        context = new Context('backend', 'get', '', []);
        command = new GetCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(getStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.backendReceiver.result]);
    });

    it('should call frontend receiver get method and print result if entity is frontend', async () => {

        getStub = sandbox.stub(FrontendReceiver.prototype, 'get');
        context = new Context('frontend', 'get', '', []);
        command = new GetCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(getStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.frontendReceiver.result]);
    });
});
