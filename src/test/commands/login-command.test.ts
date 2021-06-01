'use strict';

import Context from '../../context';
import Command from '../../commands/command';
import LoginCommand from '../../commands/login-command';
import UserReceiver from '../../receivers/user-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: login', () => {

    const sandbox = createSandbox();

    let command: Command,
        context: Context,
        helpSpy: SinonSpy,
        loginStub: SinonStub,
        printResultStub: SinonStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(LoginCommand.prototype, 'help');
        loginStub = sandbox.stub(UserReceiver.prototype, 'login');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver login method and print result', async () => {

        context = new Context('user', 'login', [], []);
        command = new LoginCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(loginStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('user', 'login', [], ['-h']);
        command = new LoginCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});