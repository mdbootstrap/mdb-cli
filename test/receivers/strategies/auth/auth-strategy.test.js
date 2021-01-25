'use strict';

const config = require('../../../../config');
const AuthStrategy = require('../../../../receivers/strategies/auth/auth-strategy');
const sandbox = require('sinon').createSandbox();
const fs = require('fs');


describe('Strategy: AuthStrategy', () => {

    let strategy;

    beforeEach(() => {

        strategy = new AuthStrategy();
        sandbox.stub(config, 'tokenDir').value('fake/token/dir');
        sandbox.stub(config, 'tokenFile').value('fake-token-file');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should throw Error if register method is not implemented', () => {

        try {
            strategy.register();
        } catch (err) {
            expect(err.message).to.equal('You must implement the register() method!');
            return;
        }
        chai.assert.fail('AuthStrategy should throw an error');
    });

    it('should throw Error if login method is not implemented', () => {

        try {
            strategy.login();
        } catch (err) {
            expect(err.message).to.equal('You must implement the login() method!');
            return;
        }
        chai.assert.fail('AuthStrategy should throw an error');
    });

    describe('logout', () => {

        let unlinkStub;

        beforeEach(() => unlinkStub = sandbox.stub(fs, 'unlinkSync'));

        it('should logout user', () => {

            unlinkStub.resolves();

            const result = strategy.logout();

            expect(result).to.be.null;
        });

        it('should return expected result if user is not logged in', () => {

            const expectedResult = 'You are not logged in.';
            unlinkStub.throws({ code: 'ENOENT' });

            const result = strategy.logout();

            expect(result).to.be.eq(expectedResult);
        });

        it('should return expected result if error', () => {

            const expectedResult = 'Logout failed: Fake error';
            unlinkStub.throws({ message: 'Fake error' });

            const result = strategy.logout();

            expect(result).to.be.eq(expectedResult);
        });
    });

    describe('saveToken', () => {

        const fakeToken = 'fake.user.token';

        let mkdirStub, writeStub;

        beforeEach(() => {

            mkdirStub = sandbox.stub(fs, 'mkdirSync');
            writeStub = sandbox.stub(fs, 'writeFileSync');
        });

        it('should save token and return expected result', () => {

            const result = strategy.saveToken(fakeToken);

            expect(result).to.be.eq(true);
        });

        it('should return expected result if no token', () => {

            const result = strategy.saveToken();

            expect(result).to.be.eq(false);
        });

        it('should return expected result if error', () => {

            mkdirStub.throws({ message: 'Fake error' });

            const result = strategy.saveToken(fakeToken);

            expect(result).to.be.eq(false);
        });
    });
});