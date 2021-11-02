import fs from 'fs';
import Context from '../../context';
import Command from '../../commands/command';
import ConfigCommand from '../../commands/config-command';
import ConfigReceiver from '../../receivers/config-receiver';
import DatabaseReceiver from '../../receivers/database-receiver';
import { createSandbox, SinonStub } from 'sinon';

describe('Command: config', () => {

    const sandbox = createSandbox();

    let printResultStub: SinonStub;

    beforeEach(() => {

        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
        sandbox.stub(Command.prototype, 'requireDotMdb');
        sandbox.stub(fs, 'existsSync').returns(true);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call config receiver changeConfig() method and print result', async () => {

        const configStub = sandbox.stub(ConfigReceiver.prototype, 'changeConfig');
        const context = new Context('config', 'config', ['projectName', 'fakeName'], []);
        const command = new ConfigCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(configStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call database receiver changePassword() method and print result', async () => {

        const changePasswordStub = sandbox.stub(DatabaseReceiver.prototype, 'changePassword');
        const context = new Context('database', 'config', ['password'], []);
        const command = new ConfigCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(changePasswordStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if entity is undefined', async () => {

        const helpSpy = sandbox.spy(ConfigCommand.prototype, 'help');
        const context = new Context('', 'config', ['projectName'], []);
        const command = new ConfigCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });

    it('should call help method and print result if args are undefined', async () => {

        const helpSpy = sandbox.spy(ConfigCommand.prototype, 'help');
        const context = new Context('config', 'config', [], []);
        const command = new ConfigCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });
});
