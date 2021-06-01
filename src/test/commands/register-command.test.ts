'use strict';

import Context from '../../context';
import Command from '../../commands/command';
import RegisterCommand from '../../commands/register-command';
import UserReceiver from '../../receivers/user-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: register', () => {

    const sandbox = createSandbox();

    let command: Command,
        context: Context,
        helpSpy: SinonSpy,
        registerStub: SinonStub,
        printResultStub: SinonStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(RegisterCommand.prototype, 'help');
        registerStub = sandbox.stub(UserReceiver.prototype, 'register');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver register method and print result', async () => {

        context = new Context('user', 'register', [], []);
        command = new RegisterCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(registerStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('user', 'register', [], ['-h']);
        command = new RegisterCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});