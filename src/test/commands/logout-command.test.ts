'use strict';

import Context from '../../context';
import Command from '../../commands/command';
import LogoutCommand from '../../commands/logout-command';
import UserReceiver from '../../receivers/user-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: logout', () => {

    const sandbox = createSandbox();

    let command: Command,
        context: Context,
        helpSpy: SinonSpy,
        logoutStub: SinonStub,
        printResultStub: SinonStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(LogoutCommand.prototype, 'help');
        logoutStub = sandbox.stub(UserReceiver.prototype, 'logout');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call receiver logout method and print result', async () => {

        context = new Context('user', 'logout', [], []);
        command = new LogoutCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(logoutStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('user', 'logout', [], ['-h']);
        command = new LogoutCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});