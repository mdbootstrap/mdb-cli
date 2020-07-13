'use strict';

const { createPackageJson } = require('../../helpers/create-package-json');
const fs = require('fs');
const path = require('path');
const ShowConfirmationPrompt = require('../../helpers/show-confirmation-prompt');
const PackageManager = require('../../utils/managers/npm-package-manager');
const childProcess = require('child_process');
const sandbox = require('sinon').createSandbox();

describe('Helper: create package json', () => {

    let joinStub,
        existsStub,
        showConfirmationPromptStub,
        spawnStub,
        manager;

    const fakePath = 'fakePath';

    beforeEach(() => {

        manager = new PackageManager();
        joinStub = sandbox.stub(path, 'join').returns('fakePath');
        existsStub = sandbox.stub(fs, 'exists');
        showConfirmationPromptStub = sandbox.stub(ShowConfirmationPrompt, 'showConfirmationPrompt');
        spawnStub = sandbox.stub(childProcess, 'spawn').returns({ on: sandbox.stub() });
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('Functions calls', () => {

        it('should call path.join before fs.exists', async () => {

            existsStub.yields(true);

            await createPackageJson(manager, fakePath);

            expect(joinStub.calledBefore(existsStub));
        });

        it('should not call showConfirmationPrompt if path exists', async () => {

            existsStub.yields(true);

            await createPackageJson(manager, fakePath);

            expect(showConfirmationPromptStub.called).to.be.false;
        });

        it('should call showConfirmationPrompt if path do not exist', (done) => {

            existsStub.yields(false);
            showConfirmationPromptStub.resolves(true);
            spawnStub.on = sandbox.stub();

            createPackageJson(manager, fakePath);

            expect(showConfirmationPromptStub.calledAfter(existsStub)).to.be.true;

            done();
        });

        it('should not call spawn if user do not want to create package.json', (done) => {

            existsStub.yields(false);
            showConfirmationPromptStub.resolves(false);

            createPackageJson(manager, fakePath).catch((err) => {

                expect(spawnStub.calledAfter(showConfirmationPromptStub)).to.be.false;
                expect(err).to.have.property('Status');
                expect(err.Status).to.be.equal(0);
                expect(err).to.have.property('Message');
                expect(err.Message).to.be.equal('package.json not created.');

                done();
            });
        });

        it('should call spawn if user want to create package.json', async () => {

            const fakeReturnedStream = { on: sandbox.stub() };
            fakeReturnedStream.on.withArgs('exit').yields(0);
            existsStub.yields(false);
            showConfirmationPromptStub.resolves(true);
            spawnStub.returns(fakeReturnedStream);

            await createPackageJson(manager, fakePath);

            expect(spawnStub.calledAfter(showConfirmationPromptStub)).to.be.true;
        });
    });

    describe('Functions calls with expected arguments', () => {

        it('should call path.join with expected arguments', async () => {

            const file = 'package.json';
            existsStub.yields(true);

            await createPackageJson(manager, fakePath);

            expect(joinStub.calledWith(fakePath, file)).to.be.true;
        });

        it('should call fs.exists with expected arguments', async () => {

            existsStub.yields(true);

            await createPackageJson(manager);

            expect(existsStub.calledWith(fakePath)).to.be.true;
        });

        it('should call showConfirmationPrompt with expected arguments', (done) => {

            existsStub.yields(false);
            showConfirmationPromptStub.resolves(true);

            createPackageJson(manager, fakePath);

            expect(showConfirmationPromptStub.calledWith('Missing package.json file. Create?')).to.be.true;

            done();
        });

        it('should call spawn with expected arguments on windows', async () => {

            const fakeReturnedStream = { on: sandbox.stub() };
            fakeReturnedStream.on.withArgs('exit').yields(0);
            existsStub.yields(false);
            sandbox.stub(manager, 'isWindows').value(true);
            showConfirmationPromptStub.resolves(true);
            spawnStub.returns(fakeReturnedStream);

            await createPackageJson(manager, fakePath);

            const result = spawnStub.getCall(0).args;

            expect(result[0]).to.be.equal('npm');
            expect(result[1]).to.be.deep.equal(['init']);
            expect(result[2].cwd).to.be.equal(fakePath);
            expect(result[2].stdio).to.be.equal('inherit');
            expect(result[2].shell).to.be.equal(true);
        });

        it('should call spawn with expected arguments on linux', async () => {

            const fakeReturnedStream = { on: sandbox.stub() };
            fakeReturnedStream.on.withArgs('exit').yields(0);
            existsStub.yields(false);
            sandbox.stub(manager, 'isWindows').value(false);
            showConfirmationPromptStub.resolves(true);
            spawnStub.returns(fakeReturnedStream);

            await createPackageJson(manager, fakePath);

            const result = spawnStub.getCall(0).args;

            expect(result[0]).to.be.equal('npm');
            expect(result[1]).to.be.deep.equal(['init']);
            expect(result[2].cwd).to.be.equal(fakePath);
            expect(result[2].stdio).to.be.equal('inherit');
            expect(result[2].shell).to.be.equal(undefined);
        });
    });

    describe('Results', () => {

        describe('Resolves', () => {

            const successMsg = { Status: 0, Message: 'package.json created.' };

            it('should resolve if file exists', async () => {

                existsStub.yields(true);

                const result = await createPackageJson(manager, fakePath);

                expect(result).to.be.deep.equal(successMsg);
            });

            it('should resolve if file does not exist and user agree to create file', async () => {

                const fakeReturnedStream = { on: sandbox.stub() };
                fakeReturnedStream.on.withArgs('exit').yields(0);
                existsStub.yields(false);
                showConfirmationPromptStub.resolves(true);
                spawnStub.returns(fakeReturnedStream);

                const result = await createPackageJson(manager, fakePath);

                expect(result).to.be.deep.equal(successMsg);
            });
        });

        describe('Rejects', () => {

            it('should reject if status code is not equal 0', async () => {

                const fakeCode = 1;
                const expectedResult = { Status: fakeCode, Message: 'Problem with npm initialization' };
                const fakeReturnedStream = { on: sandbox.stub() };
                fakeReturnedStream.on.withArgs('exit').yields(fakeCode);
                existsStub.yields(false);
                showConfirmationPromptStub.resolves(true);
                spawnStub.returns(fakeReturnedStream);

                try {

                    await createPackageJson(manager, fakePath);
                    throw new Error('Error is not thrown');
                } catch (e) {

                    expect(e).to.be.deep.equal(expectedResult);
                }
            });

            it('should reject if error thrown', async () => {

                const fakeError = 'fake error';
                const fakeReturnedStream = { on: sandbox.stub() };
                fakeReturnedStream.on.withArgs('error').yields(fakeError);
                existsStub.yields(false);
                showConfirmationPromptStub.resolves(true);
                spawnStub.returns(fakeReturnedStream);

                try {

                    await createPackageJson(manager, fakePath);
                    throw new Error('Error is not thrown');
                } catch (e) {

                    expect(e).to.be.equal(fakeError);
                }
            });
        });
    });
});
