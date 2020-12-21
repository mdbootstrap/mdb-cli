'use strict';

const sandbox = require('sinon').createSandbox();
const NormalLoginStrategy = require('../../../../utils/strategies/login/normal-login-strategy');

describe('Strategy: Login -> NormalLoginStrategy', function () {

    let strategy = null;

    beforeEach(() => {
        strategy = new NormalLoginStrategy();
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    it('should call askCredentials', function () {

        const stub = sandbox.stub(strategy, 'askCredentials').resolves();

        strategy.login();

        expect(stub).to.have.been.calledOnce;
    });

    it('should call HttpWrapper.post', async function () {

        const HttpWrapper = require('../../../../utils/http-wrapper');
        const stub = sandbox.stub(HttpWrapper.prototype, 'post').resolves();

        sandbox.stub(strategy, 'askCredentials').resolves();

        await strategy.login();

        expect(stub).to.have.been.calledOnce;
    });

    it('should askCredentials set options.data', async function () {

        const fakeAnswers = { username: 'fakeusername', password: 'fakepass' };
        const promptStub = sandbox.stub().resolves(fakeAnswers);

        const prompt = require('inquirer');
        sandbox.stub(prompt, 'createPromptModule').returns(promptStub);

        await strategy.askCredentials();

        expect(strategy.options.data).to.equal(JSON.stringify(fakeAnswers));
        expect(strategy.options.headers['Content-Length']).to.equal(Buffer.byteLength(strategy.options.data));
    });
});
