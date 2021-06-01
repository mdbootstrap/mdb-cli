'use strict';

import config from '../../../../config';
import AuthStrategy from '../../../../receivers/strategies/auth/auth-strategy';
import fs from 'fs';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Strategy: AuthStrategy', () => {

    const sandbox = createSandbox();

    let strategy: AuthStrategy;

    beforeEach(() => {

        // @ts-ignore
        strategy = new AuthStrategy();
        sandbox.stub(config, 'tokenDir').value('fake/token/dir');
        sandbox.stub(config, 'tokenFile').value('fake-token-file');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('logout', () => {

        let unlinkStub: SinonStub;

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

        let mkdirStub: SinonStub,
            writeStub: SinonStub;

        beforeEach(() => {

            mkdirStub = sandbox.stub(fs, 'mkdirSync');
            writeStub = sandbox.stub(fs, 'writeFileSync');
        });

        it('should save token and return expected result', () => {

            const result = strategy.saveToken(fakeToken);

            expect(result).to.be.eq(true);
        });

        it('should return expected result if no token', () => {

            // @ts-ignore
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
