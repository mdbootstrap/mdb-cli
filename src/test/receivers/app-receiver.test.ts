import Context from '../../context';
import AppReceiver from '../../receivers/app-receiver';
import { createSandbox } from 'sinon';
import { expect } from 'chai';

describe('Receiver: app', () => {

    const sandbox = createSandbox();

    let context: Context,
        receiver: AppReceiver;

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: getHelp', () => {

        beforeEach(() => {

            context = new Context('app', 'help', [], []);
            receiver = new AppReceiver(context);
        });

        it('should set the expected result', () => {

            receiver.getHelp();

            expect(receiver.result.messages).to.be.an('array').that.is.not.empty;
        });
    });

    describe('Method: getVersion', () => {

        //@ts-ignore
        const packageJson = require('../../../package.json');
        const expectedResult = { type: 'text', value: `Version: ${packageJson.version}` };

        beforeEach(() => {

            context = new Context('app', 'version', [], []);
            receiver = new AppReceiver(context);
        });

        it('should set the expected result', () => {

            receiver.getVersion();

            expect(receiver.result.messages).to.be.an('array').that.is.not.empty;
            expect(receiver.result.messages).to.deep.include(expectedResult);
        });
    });

    describe('Method: updateApp', () => {

        beforeEach(() => {

            context = new Context('app', 'update', [], []);
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
