'use strict';

const { downloadProStarter } = require('../../helpers/download-pro-starter');
const config = require('../../config/');
const HttpWrapper = require('../../utils/http-wrapper');
const fs = require('fs');
const path = require('path');
const progress = require('progress');
const unzip = require('unzipper');
const { Readable } = require('stream');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();

describe('Helper: download pro starter', () => {

    const fakePort = 0;
    const fakeHost = 'fakeHost';
    const fakeHeader = { fake: 'fakeHeader' };
    const fakePath = 'fakePath';
    let fakeRequest;
    let fakeResponse;
    let fakePipe;
    let fakeExtract;
    let createRequestStub;
    let readablePipeStub;
    let extractStub;
    let joinStub;
    let renameStub;

    beforeEach(() => {

        fakeRequest = { on: sandbox.stub(), write: sandbox.stub(), end: sandbox.stub() };
        fakeResponse = { on: sandbox.stub(), headers: fakeHeader };
        fakePipe = { on: sandbox.stub().withArgs('close').yields('') };
        fakeExtract = { on: sandbox.stub() };
        sandbox.replace(config, 'port', fakePort);
        sandbox.replace(config, 'host', fakeHost);
        createRequestStub = sandbox.stub(HttpWrapper.prototype, 'createRequest').returns(fakeRequest).yields(fakeResponse);
        readablePipeStub = sandbox.stub(Readable.prototype, 'pipe').returns(fakePipe);
        extractStub = sandbox.stub(unzip, 'Extract').returns(fakeExtract);
        joinStub = sandbox.stub(path, 'join').returns(fakePath);
        renameStub = sandbox.stub(fs, 'rename').yields(false);
        sandbox.stub(progress.prototype, 'tick').returns();
        sandbox.spy(console, 'log');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should return promise', () => {

        expect(downloadProStarter()).to.be.a('promise');
    });

    describe('Functions calls', () => {

        it('should call ProgressBar', async () => {

            await downloadProStarter();

            expect(extractStub.calledOnce).to.be.true;
        });

        describe('HttpWrapper.createRequest', () => {

            beforeEach(async () => await downloadProStarter());

            it('should call createRequest', () => {

                expect(createRequestStub.calledOnce).to.be.true;
            });

            it('should call createRequest.on', () => {

                expect(fakeRequest.on.calledOnce).to.be.true;
            });

            it('should call createRequest.write', () => {

                expect(fakeRequest.write.calledOnce).to.be.true;
            });

            it('should call createRequest.end', () => {

                expect(fakeRequest.end.calledOnce).to.be.true;
            });
        });

        describe('HttpWrapper response', () => {

            it('should call request response.on data', async () => {

                fakeResponse = { on: sandbox.stub().withArgs('data'), headers: fakeHeader };
                createRequestStub.returns(fakeRequest).yields(fakeResponse);

                await downloadProStarter();

                expect(fakeResponse.on.calledTwice).to.be.true;
            });

            it('should call request response.on end', async () => {

                fakeResponse = { on: sandbox.stub().withArgs('end').yields(''), headers: fakeHeader };
                createRequestStub.returns(fakeRequest).yields(fakeResponse);

                await downloadProStarter();

                expect(fakeResponse.on.calledTwice).to.be.true;
            });
        });

        describe('Readable', () => {

            it('should call pipe', async () => {

                await downloadProStarter();

                expect(readablePipeStub.calledOnce).to.be.true;
            });

            it('should call pipe.on close', async () => {

                await downloadProStarter();

                expect(fakePipe.on.calledOnce).to.be.true;
            });
        });

        it('should call unzip.extract', async () => {

            await downloadProStarter();

            expect(extractStub.calledOnce).to.be.true;
        });

        describe('After unzip', () => {

            const fakePackageName = 'fakePackageName';
            const fakeProjectName = 'fakeProjectName';

            beforeEach(async () => {

                await downloadProStarter(fakePackageName, undefined, undefined, fakeProjectName);
            });

            it('should call path.join', () => {

                expect(joinStub.calledTwice).to.be.true;
            });

            it('should call fs.rename', () => {

                expect(renameStub.calledOnce).to.be.true;
            });
        });

        describe('Log', () => {

            it('on pipe error', async () => {

                extractStub.throws('fakeError');
                readablePipeStub.returns(fakePipe);

                try {

                    await downloadProStarter();
                    throw new Error('should throw error');
                } catch(e) {

                    expect(console.log.calledOnce).to.be.true;
                }
            });

            it('on end', async () => {

                fakeResponse = { on: sandbox.stub().withArgs('end').yields(''), headers: fakeHeader };
                createRequestStub.returns(fakeRequest).yields(fakeResponse);

                await downloadProStarter();

                expect(console.log.calledOnce).to.be.true;
            });
        });
    });

    describe('Functions calls with expected arguments', () => {

        it('should create HttpWrapper with expected option', async () => {

            const fakePackageName = 'fakePackageName';
            const expectedOptions = {
                port: config.port,
                hostname: config.host,
                path: `/packages/download/${fakePackageName}`,
                method: 'GET',
                data: '',
                headers: fakeHeader
            };
            const expectedResult = new HttpWrapper(expectedOptions);

            await downloadProStarter(fakePackageName, fakeHeader);

            expect(createRequestStub.thisValues[0]).to.be.deep.equal(expectedResult);
        });

        describe('HttpWrapper.createRequest', () => {

            beforeEach(async () => await downloadProStarter());

            it('should call createRequest', () => {

                expect(createRequestStub.firstCall.args[0]).to.be.an('function');
            });

            it('should call createRequest.on', () => {

                expect(fakeRequest.on.firstCall.args[0]).to.be.equal('error');
            });

            it('should call createRequest.write', () => {

                expect(fakeRequest.write.firstCall.args).to.be.deep.equal([ '' ]);
            });

            it('should call createRequest.end', () => {

                expect(fakeRequest.end.firstCall.args).to.be.an('array').that.is.empty;
            });
        });

        describe('HttpWrapper response', () => {

            it('should call request response.on data', async () => {

                fakeResponse = { on: sandbox.stub().withArgs('data').yields(''), headers: fakeHeader };
                createRequestStub.returns(fakeRequest).yields(fakeResponse);

                await downloadProStarter();

                expect(fakeResponse.on.firstCall.args[0]).to.be.equal('data');
            });

            it('should call request response.on end', async () => {

                fakeResponse = { on: sandbox.stub().withArgs('end').yields(''), headers: fakeHeader };
                createRequestStub.returns(fakeRequest).yields(fakeResponse);

                await downloadProStarter();

                expect(fakeResponse.on.secondCall.args[0]).to.be.equal('end');
            });
        });

        describe('Readable', () => {

            it('should call pipe', async () => {

                await downloadProStarter();

                expect(readablePipeStub.firstCall.args[0]).to.be.deep.equal(fakeExtract);
            });

            it('should call pipe.on close', async () => {

                fakePipe = { on: sandbox.stub().withArgs('close').yields('') };
                readablePipeStub.returns(fakePipe);

                await downloadProStarter();

                expect(fakePipe.on.firstCall.args[0]).to.be.equal('close');
            });
        });

        it('should call unzip.extract', async () => {

            await downloadProStarter(undefined, undefined, fakePath);

            expect(extractStub.firstCall.args[0]).to.be.deep.equal({ path: fakePath });
        });

        describe('After unzip', () => {

            const fakePackageName = 'fakePackageName';
            const fakeProjectName = 'fakeProjectName';
            let expectedArgs;

            beforeEach(async () => {

                fakePipe = { on: sandbox.stub().withArgs('close').yields('') };
                readablePipeStub.returns(fakePipe);

                await downloadProStarter(fakePackageName, undefined, fakePath, fakeProjectName);
            });

            it('should call path.join with packageName', () => {

                expectedArgs = [fakePath, fakePackageName];

                expect(joinStub.firstCall.args).to.be.deep.equal(expectedArgs);
            });

            it('should call path.join with projectName', () => {

                expectedArgs = [fakePath, fakeProjectName];

                expect(joinStub.secondCall.args).to.be.deep.equal(expectedArgs);
            });

            it('should call fs.rename', () => {

                expect(renameStub.firstCall.args[0]).to.be.equal(fakePath);
            });
        });
    });

    describe('Resolve with expected result', () => {

        const expectedResult = [{ 'Status': CliStatus.SUCCESS, 'Message': 'Initialization completed.' }];

        beforeEach(() => {

            fakeResponse = { on: sandbox.stub().withArgs('end').yields(''), headers: fakeHeader };
            fakePipe = { on: sandbox.stub().withArgs('close').yields('') };
            createRequestStub.returns(fakeRequest).yields(fakeResponse);
            readablePipeStub.returns(fakePipe);
        });

        it('if projectName set', async () => {

            const result = await downloadProStarter();

            expect(result).to.be.deep.equal(expectedResult);
        });

        it('if projectName not set', async () => {

            const fakePackageName = 'fakePackageName';
            const fakeProjectName = 'fakeProjectName';

            const result = await downloadProStarter(fakePackageName, undefined, undefined, fakeProjectName);

            expect(result).to.be.deep.equal(expectedResult);
        });
    });

    describe('Reject', () => {

        describe('On wrong status code', () => {

            let code;
            const errorMsg = 'fake error';

            afterEach(async () => {

                createRequestStub.yields({ statusCode: code, statusMessage: errorMsg });

                try {

                    await downloadProStarter();
                    throw new Error('should throw error');
                } catch (e) {

                    expect(e).to.be.equal(`${code} ${errorMsg}`);
                }
            });

            it('should reject promise if status code is 400', async () => {

                code = 400;
            });

            it('should reject promise if status code is 499', async () => {

                code = 499;
            });

            it('should reject promise if status code is 450', async () => {

                code = 450;
            });
        });

        describe('On errors', () => {

            const fakeError = 'fakeError';

            it('on request error', async () => {

                fakeRequest = { on: sandbox.stub().withArgs('error').yields(fakeError), write: sandbox.stub(), end: sandbox.stub() };
                fakePipe = { on: sandbox.stub().withArgs('close').returns() };
                createRequestStub.returns(fakeRequest);
                readablePipeStub.returns(fakePipe);

                try {

                    await downloadProStarter();
                    throw new Error('should throw error');
                } catch (e) {

                    expect(e).to.be.equal(fakeError);
                }
            });

            it('on pipe error', async () => {

                extractStub.throws(fakeError);

                try {

                    await downloadProStarter();
                    throw new Error('should throw error');
                } catch (e) {

                    expect(e).to.be.deep.equal([{ 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': 'Error initializing your project' }]);
                }
            });

            it('on rename error', async () => {

                renameStub.yields(fakeError);

                try {

                    await downloadProStarter('fakePackageName');
                    throw new Error('should throw error');
                } catch (e) {

                    expect(e).to.be.equal(fakeError);
                }
            });
        });
    });
});
