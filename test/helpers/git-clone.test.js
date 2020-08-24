'use strict';

const { gitClone } = require('../../helpers/git-clone');
const CliStatus = require('../../models/cli-status');
const childProcess = require('child_process');

describe('Helper: git clone', () => {

    const fakeUrl = 'fakeUrl';
    const fakeProjectName = 'fakeProjectName';
    const fakeEventEmitter = { on: sinon.stub() };
    const fakeReturnedStream = { ...fakeEventEmitter, stdout: fakeEventEmitter, stderr: fakeEventEmitter };
    let spawnStub;

    beforeEach(() => {

        spawnStub = sinon.stub(childProcess, 'spawn');
    });

    afterEach(() => {

        sinon.reset();
        sinon.restore();
        spawnStub.reset();
        spawnStub.restore();
        fakeEventEmitter.on.reset();
    });

    describe('Results', () => {

        it('should return promise', () => {

            spawnStub.returns(fakeReturnedStream);

            expect(gitClone()).to.be.a('promise');
        });

        it('should resolve on code equal 0', async () => {

            const code = CliStatus.SUCCESS;
            const expectedResult = [{ Status: code, Message: 'Success.' }];
            fakeReturnedStream.on.withArgs('exit').yields(code);
            spawnStub.returns(fakeReturnedStream);

            const result = await gitClone();

            expect(result).to.be.deep.equal(expectedResult);
        });

        it('should reject on code not equal 0', async () => {

            const code = CliStatus.INTERNAL_SERVER_ERROR;
            const expectedResult = [{ 'Status': code, 'Message': 'There were some errors. Please try again.' }];
            fakeReturnedStream.on.withArgs('exit').yields(code);
            spawnStub.returns(fakeReturnedStream);

            try {

                await gitClone();
                throw new Error('should throw error');
            } catch (e) {

                expect(e).to.be.deep.equal(expectedResult);
            }
        });

        it('should reject on error', async () => {

            const fakeError = 'fake error';
            fakeReturnedStream.on.withArgs('error').yields(fakeError);
            spawnStub.returns(fakeReturnedStream);

            try {

                await gitClone();
                throw new Error('should throw error');
            } catch (e) {

                expect(e).to.be.equal(fakeError);
            }
        });
    });

    describe('Spawn call', () => {

        beforeEach(() => {

            fakeReturnedStream.on.withArgs('exit').yields(0);
            spawnStub.returns(fakeReturnedStream);
        });

        it('should call spawn', async () => {

            await gitClone();

            expect(spawnStub.calledOnce).to.be.true;
        });

        it('should call spawn with expected arguments', async () => {

            await gitClone();

            expect(spawnStub.calledWith('git', ['clone', undefined])).to.be.true;
        });

        it('should call spawn with fake url', async () => {

            await gitClone(fakeUrl);

            expect(spawnStub.calledWith('git', ['clone', fakeUrl])).to.be.true;
        });

        it('should call spawn with fake project name', async () => {

            await gitClone(fakeUrl, fakeProjectName);

            expect(spawnStub.calledWith('git', ['clone', fakeUrl, fakeProjectName])).to.be.true;
        });

        it('should have option { shell: true } on windows', async () => {

            const isWinStub = sinon.stub(process, 'platform').value('win32');

            await gitClone(fakeUrl, fakeProjectName);

            expect(spawnStub.calledWith('git', ['clone', fakeUrl, fakeProjectName], { shell: true })).to.be.true;

            isWinStub.reset();
            isWinStub.restore();
        });
    });

    describe('Log status', () => {

        const fakeData = 'fake data';

        beforeEach(() => {

            sinon.spy(console, 'log');
        });

        afterEach(() => {

            console.log.restore();
        });

        it('should print stdout', async () => {

            fakeReturnedStream.on.withArgs('exit').yields(0);
            fakeReturnedStream.stdout.on.withArgs('data').yields(fakeData);
            spawnStub.returns(fakeReturnedStream);

            await gitClone();

            expect(console.log.calledWithExactly(fakeData)).to.be.true;
        });

        it('should print sterr', async () => {

            fakeReturnedStream.on.withArgs('exit').yields(1);
            fakeReturnedStream.stderr.on.withArgs('data').yields(fakeData);
            spawnStub.returns(fakeReturnedStream);

            try {
                await gitClone();
            }
            catch (e) {
                expect(console.log.calledWithExactly(fakeData)).to.be.true;
            }
        });
    });
});
