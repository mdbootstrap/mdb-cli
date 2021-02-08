'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const ConfigCommand = require('../../commands/config-command');
const ConfigReceiver = require('../../receivers/config-receiver');
const DatabaseReceiver = require('../../receivers/database-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: config', () => {

    let printResultStub;

    beforeEach(() => {

        printResultStub = sandbox.stub(Command.prototype, 'printResult');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call config receiver changeConfig() method and print result', async () => {

        const configStub = sandbox.stub(ConfigReceiver.prototype, 'changeConfig');
        const context = new Context('config', 'config', '', []);
        const command = new ConfigCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(configStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.configReceiver.result]);
    });

    it('should call database receiver changePassword() method and print result', async () => {

        const changePasswordStub = sandbox.stub(DatabaseReceiver.prototype, 'changePassword');
        const context = new Context('database', 'config', ['password'], []);
        const command = new ConfigCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(changePasswordStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.databaseReceiver.result]);
    });
});
