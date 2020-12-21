'use strict';

const sandbox = require('sinon').createSandbox();
const TwitterLoginStrategy = require('../../../../utils/strategies/login/twitter-login-strategy');

describe('Strategy: Login -> TwitterLoginStrategy', function () {

    let strategy = null;

    beforeEach(() => {
        strategy = new TwitterLoginStrategy();
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    it('should call openSocialLoginBrowser()', function () {

        const stub = sandbox.stub(strategy, 'openSocialLoginBrowser');
        sandbox.stub(strategy, 'askCredentials').returns([{ token: 'faketoken' }]);

        strategy.login();

        expect(stub).to.have.been.calledOnce;
    });

    it('should call askCredentials()', function () {

        sandbox.stub(strategy, 'openSocialLoginBrowser');
        const stub = sandbox.stub(strategy, 'askCredentials').returns([{ token: 'faketoken' }]);

        strategy.login();

        expect(stub).to.have.been.calledOnce;
    });

    it('should askCredentials return a token', async function () {

        const fakeAnswers = { token: 'faketoken' };
        const promptStub = sandbox.stub().resolves(fakeAnswers);

        const prompt = require('inquirer');
        sandbox.stub(prompt, 'createPromptModule').returns(promptStub);

        const result = await strategy.askCredentials();

        expect(result).to.equal(fakeAnswers.token);
    });
});
