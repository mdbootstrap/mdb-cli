'use strict';

const { downloadUserProject } = require('../../helpers/download-user-project');
const HttpWrapper = require('../../utils/http-wrapper');
const sandbox = require('sinon').createSandbox();
const ProgressBar = require('progress');
const { Readable } = require('stream');
const config = require('../../config');
const unzip = require('unzipper');

describe('Helper: download user project', () => {

    const fakePort = 0,
        fakeHost = 'fakeHost',
        fakeMessage = 'Fake message',
        fakeHeaders = { fake: 'fakeHeader' },
        fakeProjectName = 'fakeProjectName',
        fakeDestination = 'fake/dest/folder';

    let fakeRequest,
        fakeResponse,
        fakePipe,
        fakeExtract,
        createRequestStub,
        readablePipeStub,
        extractStub;

    beforeEach(() => {

        fakeRequest = { on: sandbox.stub(), write: sandbox.stub(), end: sandbox.stub() };
        fakeResponse = { on: sandbox.stub(), headers: fakeHeaders, statusCode: 200 };
        fakeExtract = { on: sandbox.stub() };
        fakePipe = { on: sandbox.stub() };
        sandbox.replace(config, 'port', fakePort);
        sandbox.replace(config, 'host', fakeHost);
        createRequestStub = sandbox.stub(HttpWrapper.prototype, 'createRequest');
        readablePipeStub = sandbox.stub(Readable.prototype, 'pipe');
        extractStub = sandbox.stub(unzip, 'Extract');
        sandbox.stub(ProgressBar.prototype, 'tick').returns();
        sandbox.spy(console, 'log');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should download user project', async () => {

        const expectedResult = { Status: 0, Message: 'Download completed.' };

        fakeResponse.on.withArgs('end').yields();
        fakeResponse.on.withArgs('data').yields('fakeData');
        createRequestStub.returns(fakeRequest).yields(fakeResponse);
        fakePipe.on.withArgs('close').yields('');
        readablePipeStub.returns(fakePipe);
        extractStub.returns(fakeExtract);

        const result = await downloadUserProject(fakeProjectName, fakeHeaders, fakeDestination);

        sandbox.assert.callOrder(createRequestStub, extractStub, readablePipeStub);
        expect(result).to.be.deep.include(expectedResult);
    });

    it('should download user project with force flag', async () => {

        const expectedResult = { Status: 0, Message: 'Download completed.' };

        fakeResponse.on.withArgs('end').yields();
        fakeResponse.on.withArgs('data').yields('fakeData');
        createRequestStub.returns(fakeRequest).yields(fakeResponse);
        fakePipe.on.withArgs('close').yields('');
        readablePipeStub.returns(fakePipe);
        extractStub.returns(fakeExtract);

        const result = await downloadUserProject(fakeProjectName, fakeHeaders, fakeDestination, true);

        sandbox.assert.callOrder(createRequestStub, extractStub, readablePipeStub);
        expect(result).to.be.deep.include(expectedResult);
    });

    it('should return expected result if error', async () => {

        const expectedResult = { Status: 500, Message: 'Error downloading your project' };

        createRequestStub.returns(fakeRequest).yields(fakeResponse);
        readablePipeStub.throws('fakeErr');
        extractStub.returns(fakeExtract);

        try {

            await downloadUserProject(fakeProjectName, fakeHeaders, fakeDestination);
        }
        catch (err) {

            expect(err).to.be.deep.equal(expectedResult);
        }
    });

    it('should return expected result if error response status code', async () => {

        const expectedResult = { Status: 423, Message: fakeMessage };

        fakeResponse.statusCode = 423;
        fakeResponse.statusMessage = fakeMessage;
        fakeResponse.on.withArgs('end').yields();
        fakeResponse.on.withArgs('data').yields('');
        createRequestStub.returns(fakeRequest).yields(fakeResponse);

        try {

            await downloadUserProject(fakeProjectName, fakeHeaders, fakeDestination);
        }
        catch (err) {

            expect(err).to.be.deep.equal(expectedResult);
        }
    });
});
