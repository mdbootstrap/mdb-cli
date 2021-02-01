'use strict';

const Context = require('../../context');
const UserReceiver = require('../../receivers/user-receiver');
const AuthStrategy = require('../../receivers/strategies/auth/auth-strategy');
const NormalAuthStrategy = require('../../receivers/strategies/auth/normal-auth-strategy');
const GoogleAuthStrategy = require('../../receivers/strategies/auth/google-auth-strategy');
const FacebookAuthStrategy = require('../../receivers/strategies/auth/facebook-auth-strategy');
const TwitterAuthStrategy = require('../../receivers/strategies/auth/twitter-auth-strategy');
const sandbox = require('sinon').createSandbox();
const btoa = require('btoa');

describe('Receiver: user', () => {

    const fakeError = 'fake error';
    const errorMessage = { type: 'alert', value: { title: 'Error', body: fakeError }, color: 'red' };

    let context, receiver;

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Method: register', () => {

        const successMessage = { type: 'text', value: 'Successfully registered.' };

        let registerStub;

        beforeEach(() => {

            context = new Context('user', 'register', '', []);
            receiver = new UserReceiver(context);
            registerStub = sandbox.stub(NormalAuthStrategy.prototype, 'register');
        });

        it('should call normal auth strategy register method and return the expected result on successful registration', async () => {

            registerStub.resolves();

            await receiver.register();

            sandbox.assert.calledOnce(registerStub);
            expect(receiver.result.messages).to.deep.include(successMessage);
        });

        it('should call normal auth strategy register method and return the expected result if registration failed', async () => {

            registerStub.resolves(fakeError);

            await receiver.register();

            sandbox.assert.calledOnce(registerStub);
            expect(receiver.result.messages).to.deep.include(errorMessage);
        });
    });

    describe('Method: login', () => {

        const successMessage = { type: 'text', value: 'Successfully logged in.' };

        let loginStub;

        describe('Normal auth strategy', () => {

            beforeEach(() => {

                context = new Context('user', 'login', '', ['--method', 'normal']);
                receiver = new UserReceiver(context);
                loginStub = sandbox.stub(NormalAuthStrategy.prototype, 'login');
            });

            it('should call normal strategy login method and return the expected result on successful login', async () => {

                loginStub.resolves();

                await receiver.login();

                sandbox.assert.calledOnce(loginStub);
                expect(receiver.result.messages).to.deep.include(successMessage);
            });

            it('should call normal strategy login method and return the expected result if login failed', async () => {

                loginStub.resolves(fakeError);

                await receiver.login();

                sandbox.assert.calledOnce(loginStub);
                expect(receiver.result.messages).to.deep.include(errorMessage);
            });
        });

        describe('Google auth strategy', () => {

            beforeEach(() => {

                context = new Context('user', 'login', '', ['--method', 'google']);
                receiver = new UserReceiver(context);
                loginStub = sandbox.stub(GoogleAuthStrategy.prototype, 'login');
            });

            it('should call google strategy login method and return the expected result on successful login', async () => {

                loginStub.resolves();

                await receiver.login();

                sandbox.assert.calledOnce(loginStub);
                expect(receiver.result.messages).to.deep.include(successMessage);
            });

            it('should call google strategy login method and return the expected result if login failed', async () => {

                loginStub.resolves(fakeError);

                await receiver.login();

                sandbox.assert.calledOnce(loginStub);
                expect(receiver.result.messages).to.deep.include(errorMessage);
            });
        });

        describe('Facebook auth strategy', () => {

            beforeEach(() => {

                context = new Context('user', 'login', '', ['--method', 'facebook']);
                receiver = new UserReceiver(context);
                loginStub = sandbox.stub(FacebookAuthStrategy.prototype, 'login');
            });

            it('should call facebook strategy login method and return the expected result on successful login', async () => {

                loginStub.resolves();

                await receiver.login();

                sandbox.assert.calledOnce(loginStub);
                expect(receiver.result.messages).to.deep.include(successMessage);
            });

            it('should call facebook strategy login method and return the expected result if login failed', async () => {

                loginStub.resolves(fakeError);

                await receiver.login();

                sandbox.assert.calledOnce(loginStub);
                expect(receiver.result.messages).to.deep.include(errorMessage);
            });
        });

        describe('Twitter auth strategy', () => {

            beforeEach(() => {

                context = new Context('user', 'login', '', ['--method', 'twitter']);
                receiver = new UserReceiver(context);
                loginStub = sandbox.stub(TwitterAuthStrategy.prototype, 'login');
            });

            it('should call twitter strategy login method and return the expected result on successful login', async () => {

                loginStub.resolves();

                await receiver.login();

                sandbox.assert.calledOnce(loginStub);
                expect(receiver.result.messages).to.deep.include(successMessage);
            });

            it('should call twitter strategy login method and return the expected result if login failed', async () => {

                loginStub.resolves(fakeError);

                await receiver.login();

                sandbox.assert.calledOnce(loginStub);
                expect(receiver.result.messages).to.deep.include(errorMessage);
            });
        });

        describe('Default auth strategy', () => {

            beforeEach(() => {

                context = new Context('user', 'login', '', []);
                receiver = new UserReceiver(context);
                sandbox.stub(receiver, 'socialProvider').value(null);
                loginStub = sandbox.stub(NormalAuthStrategy.prototype, 'login');
            });

            it('should call normal strategy login method and return the expected result on successful login', async () => {

                loginStub.resolves();

                await receiver.login();

                sandbox.assert.calledOnce(loginStub);
                expect(receiver.result.messages).to.deep.include(successMessage);
            });

            it('should call normal strategy login method and return the expected result if login failed', async () => {

                loginStub.resolves(fakeError);

                await receiver.login();

                sandbox.assert.calledOnce(loginStub);
                expect(receiver.result.messages).to.deep.include(errorMessage);
            });
        });
    });

    describe('Method: logout', () => {

        const successMessage = { type: 'text', value: 'Successfully logged out.' };

        let logoutStub;

        beforeEach(() => {

            context = new Context('user', 'logout', '', []);
            receiver = new UserReceiver(context);
            logoutStub = sandbox.stub(AuthStrategy.prototype, 'logout');
        });

        it('should call auth strategy logout method and return the expected result on successful logout', async () => {

            logoutStub.resolves();

            await receiver.logout();

            sandbox.assert.calledOnce(logoutStub);
            expect(receiver.result.messages).to.deep.include(successMessage);
        });

        it('should call auth strategy logout method and return the expected result if logout failed', async () => {

            logoutStub.resolves(fakeError);

            await receiver.logout();

            sandbox.assert.calledOnce(logoutStub);
            expect(receiver.result.messages).to.deep.include(errorMessage);
        });
    });

    describe('Method: whoami', () => {

        const successMessage = { type: 'text', value: 'fakeUsername' };

        let authenticateStub;

        beforeEach(() => {

            context = new Context('user', 'whoami', '', []);
            receiver = new UserReceiver(context);
            authenticateStub = sandbox.stub(Context.prototype, 'authenticateUser');
        });

        it('should call authenticateUser method and print username', async () => {

            const fakeToken = `fakefake.${btoa(JSON.stringify({ name: 'fakeUsername' }))}.fakefake`;
            sandbox.stub(context, 'userToken').value(fakeToken);

            await receiver.whoami();

            sandbox.assert.calledOnce(authenticateStub);
            expect(receiver.result.messages).to.deep.include(successMessage);
        });
    });
});
