'use strict';

const Context = require('../../context');
const AppReceiver = require('../../receivers/app-receiver');
const sandbox = require('sinon').createSandbox();

describe('Receiver: app', () => {

    let context, receiver;

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: getHelp', () => {

        beforeEach(() => {

            context = new Context('app', 'help', '', []);
            receiver = new AppReceiver(context);
        });

        it('should set the expected result', () => {

            receiver.getHelp();

            expect(receiver.result.messages).to.be.an('array').that.is.not.empty;
        });
    });

    describe('Method: getVersion', () => {

        const packageJson = require('../../package.json');
        const expectedResult = { type: 'text', value: `Version: ${packageJson.version}` };

        beforeEach(() => {

            context = new Context('app', 'version', '', []);
            receiver = new AppReceiver(context);
        });

        it('should set the expected result', () => {

            receiver.getVersion();

            expect(receiver.result.messages).to.be.an('array').that.is.not.empty;
            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: updateApp', () => {

        const packageJson = require('../../package.json');

        beforeEach(() => {

            context = new Context('app', 'update', '', []);
            receiver = new AppReceiver(context);
        });

        it('should set the expected result if success', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Success', body: '' }, color: 'green' };
            sandbox.stub(Context.prototype, 'loadPackageManager').resolves();
            sandbox.stub(context, 'packageManager').value({ update: sandbox.stub().resolves(expectedResult.value.body) });

            await receiver.updateApp();

            expect(receiver.result.messages).to.be.an('array').that.is.not.empty;
            expect(receiver.result.messages).to.deep.include(expectedResult);
        });

        it('should set the expected result if error', async () => {

            const expectedResult = { type: 'alert', value: { title: 'Error:', body: new Error('Update failed') }, color: 'red' };
            sandbox.stub(Context.prototype, 'loadPackageManager').resolves();
            sandbox.stub(context, 'packageManager').value({ update: sandbox.stub().rejects(expectedResult.value.body) });

            await receiver.updateApp();

            expect(receiver.result.messages).to.be.an('array').that.is.not.empty;
            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });
});
