'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const LogoutCommand = require('../../commands/logout-command');
const UserReceiver = require('../../receivers/user-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: logout', () => {

    let command, context;

    beforeEach(() => {

        context = new Context('user', 'logout', '', []);
        command = new LogoutCommand(context);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver logout method and print result', async () => {

        const loginStub = sandbox.stub(UserReceiver.prototype, 'logout');
        const printResultStub = sandbox.stub(Command.prototype, 'printResult');

        await command.execute();

        sandbox.assert.calledOnce(loginStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });
});