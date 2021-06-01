'use strict';

import Context from '../../context';
import Command from '../../commands/command';
import LsCommand from '../../commands/ls-command';
import BackendReceiver from '../../receivers/backend-receiver';
import DatabaseReceiver from '../../receivers/database-receiver';
import FrontendReceiver from '../../receivers/frontend-receiver';
import OrderReceiver from '../../receivers/order-receiver';
import StarterReceiver from '../../receivers/starter-receiver';
import WordpressReceiver from '../../receivers/wordpress-receiver';
import { createSandbox, SinonSpy, SinonStub } from 'sinon';

describe('Command: ls', () => {

    const sandbox = createSandbox();

    let command: Command,
        context: Context,
        helpSpy: SinonSpy,
        listStub: SinonStub,
        printResultStub: SinonStub;

    beforeEach(() => {

        helpSpy = sandbox.spy(LsCommand.prototype, 'help');
        printResultStub = sandbox.stub(Command.prototype, 'printResult');
        sandbox.stub(Context.prototype, 'authenticateUser');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should call starter receiver list method and print result if entity is starter', async () => {

        context = new Context('starter', 'ls', [], []);
        command = new LsCommand(context);
        listStub = sandbox.stub(StarterReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call frontend receiver list method and print result if entity is frontend', async () => {

        context = new Context('frontend', 'ls', [], []);
        command = new LsCommand(context);
        listStub = sandbox.stub(FrontendReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call backend receiver list method and print result if entity is backend', async () => {

        context = new Context('backend', 'ls', [], []);
        command = new LsCommand(context);
        listStub = sandbox.stub(BackendReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call backend receiver list method and print result if entity is wordpress', async () => {

        context = new Context('wordpress', 'ls', [], []);
        command = new LsCommand(context);
        listStub = sandbox.stub(WordpressReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call database receiver list method and print result  if entity is database', async () => {

        context = new Context('database', 'ls', [], []);
        command = new LsCommand(context);
        listStub = sandbox.stub(DatabaseReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call order receiver list method and print result if entity is order', async () => {

        context = new Context('order', 'ls', [], []);
        command = new LsCommand(context);
        listStub = sandbox.stub(OrderReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call default frontend receiver list method and print results if entity is not defined', async () => {

        context = new Context('', 'ls', [], []);
        command = new LsCommand(context);
        listStub = sandbox.stub(FrontendReceiver.prototype, 'list');

        await command.execute();

        sandbox.assert.calledOnce(listStub);
        sandbox.assert.calledOnce(printResultStub);
    });

    it('should call help method and print result if --help flag is used', async () => {

        context = new Context('', 'ls', [], ['-h']);
        command = new LsCommand(context);

        await command.execute();

        sandbox.assert.calledOnce(helpSpy);
        sandbox.assert.calledOnceWithExactly(printResultStub, [command.results]);
    });

    it('should call all receivers list method and print results if entity is not defined and --all flag provided', async () => {

        context = new Context('', 'ls', [], ['--all']);
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
        sandbox.assert.calledOnce(printResultStub);
    });
});
