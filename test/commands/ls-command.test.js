'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const LsCommand = require('../../commands/ls-command');
const StarterReceiver = require('../../receivers/starter-receiver');
const FrontendReceiver = require('../../receivers/frontend-receiver');
const BackendReceiver = require('../../receivers/backend-receiver');
const DatabaseReceiver = require('../../receivers/database-receiver');
const OrderReceiver = require('../../receivers/order-receiver');
const WordpressReceiver = require('../../receivers/wordpress-receiver');
const sandbox = require('sinon').createSandbox();

describe('Command: ls', () => {

    let command,
        context,
        listStub,
        printResultStub;

    beforeEach(() => {

        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call starter receiver list method and print result if entity is starter', async () => {

        context = new Context('starter', 'ls', '', []);
        command = new LsCommand(context);
        listStub = sandbox.stub(StarterReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call frontend receiver list method and print result if entity is frontend', async () => {

        context = new Context('frontend', 'ls', '', []);
        command = new LsCommand(context);
        listStub = sandbox.stub(FrontendReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call backend receiver list method and print result if entity is backend', async () => {

        context = new Context('backend', 'ls', '', []);
        command = new LsCommand(context);
        listStub = sandbox.stub(BackendReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call backend receiver list method and print result if entity is wordpress', async () => {

        context = new Context('wordpress', 'ls', '', []);
        command = new LsCommand(context);
        listStub = sandbox.stub(WordpressReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call database receiver list method and print result  if entity is database', async () => {

        context = new Context('database', 'ls', '', []);
        command = new LsCommand(context);
        listStub = sandbox.stub(DatabaseReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call order receiver list method and print result if entity is order', async () => {

        context = new Context('order', 'ls', '', []);
        command = new LsCommand(context);
        listStub = sandbox.stub(OrderReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call default frontend receiver list method and print results if entity is not defined', async () => {

        context = new Context('', 'ls', '', []);
        command = new LsCommand(context);
        listStub = sandbox.stub(FrontendReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.receiver.result]);
    });

    it('should call all receivers list method and print results if entity is not defined and --all flag provided', async () => {

        context = new Context('', 'ls', '', ['--all']);
        command = new LsCommand(context);
        const sListStub = sandbox.stub(StarterReceiver.prototype, 'list');
        const fListStub = sandbox.stub(FrontendReceiver.prototype, 'list');
        const bListStub = sandbox.stub(BackendReceiver.prototype, 'list');
        const wListStub = sandbox.stub(WordpressReceiver.prototype, 'list');
        const dListStub = sandbox.stub(DatabaseReceiver.prototype, 'list');
        const oListStub = sandbox.stub(OrderReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(sListStub);
        sandbox.assert.calledOnce(fListStub);
        sandbox.assert.calledOnce(bListStub);
        sandbox.assert.calledOnce(wListStub);
        sandbox.assert.calledOnce(dListStub);
        sandbox.assert.calledOnce(oListStub);
        sandbox.assert.calledOnceWithExactly(printResultStub, [
            command.frontendReceiver.result,
            command.backendReceiver.result,
            command.wordpressReceiver.result,
            command.databaseReceiver.result,
            command.starterReceiver.result,
            command.orderReceiver.result
        ]);
    });
});
