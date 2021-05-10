'use strict';

const Context = require('../../context');
const ConfigReceiver = require('../../receivers/config-receiver');
const sandbox = require('sinon').createSandbox();

describe('Receiver: Config', () => {

    let context, receiver;

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    it('should register --unset flag', function () {

        context = new Context('config', 'config', [], []);
        const registerStub = sandbox.stub(context, 'registerNonArgFlags');

        new ConfigReceiver(context);

        expect(registerStub).to.have.been.calledWith(['unset', 'enable-ssl']);
    });

    it('should call unsetValue() method with provided argument', function () {

        const args = ['fakekey'];
        const flags = ['--unset'];
        context = new Context('config', 'config', args, flags);

        const saveStub = sandbox.stub(context.mdbConfig, 'save');
        const unsetStub = sandbox.stub(context.mdbConfig, 'unsetValue');

        receiver = new ConfigReceiver(context);
        receiver.changeConfig();

        expect(unsetStub).to.have.been.calledWith(...args);
        expect(saveStub).to.have.been.calledOnce;
    });

    it('should call setValue() method with provided argument', function () {

        const args = ['fakekey', 'fakevalue'];
        context = new Context('config', 'config', args, []);

        const saveStub = sandbox.stub(context.mdbConfig, 'save');
        const unsetStub = sandbox.stub(context.mdbConfig, 'setValue');

        receiver = new ConfigReceiver(context);
        receiver.changeConfig();

        expect(unsetStub).to.have.been.calledWith(...args);
        expect(saveStub).to.have.been.calledOnce;
    });
});
