'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const LoginCommand = require('../../commands/login-command');
const UserReceiver = require('../../receivers/user-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: login', () => {

    let command, context;

    beforeEach(() => {

        context = new Context('user', 'login', '', []);
        command = new LoginCommand(context);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver login method and print result', async () => {

        const loginStub = sandbox.stub(UserReceiver.prototype, 'login');
        const printResultStub = sandbox.stub(Command.prototype, 'printResult');

        await command.execute();

        sandbox.assert.calledOnce(loginStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });
});