'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const RegisterCommand = require('../../commands/register-command');
const UserReceiver = require('../../receivers/user-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: register', () => {

    let command, context;

    beforeEach(() => {

        context = new Context('user', 'register', '', []);
        command = new RegisterCommand(context);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver register method and print result', async () => {

        const registerStub = sandbox.stub(UserReceiver.prototype, 'register');
        const printResultStub = sandbox.stub(Command.prototype, 'printResult');

        await command.execute();

        sandbox.assert.calledOnce(registerStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });
});