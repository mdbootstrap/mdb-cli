'use strict';

import unzip from "unzipper";
import { Readable } from "stream";
import ProgressBar from "progress";
import config from "../../config";
import helpers from "../../helpers";
import HttpWrapper from "../../utils/http-wrapper";
import { createSandbox, SinonStub } from "sinon";
import { expect } from "chai";

describe('Helper: downloadFromFTP', () => {

    const sandbox = createSandbox();

    const fakePort = '0',
        fakeHost = 'fakeHost',
        fakeHeaders = { fake: 'fakeHeader' },
        fakeDestination = 'fake/dest/folder';

    let fakeRequest: any,
        fakeResponse: any,
        fakePipe: any,
        fakeExtract: any,
        createRequestStub: SinonStub,
        readablePipeStub: SinonStub,
        extractStub: SinonStub,
        http: HttpWrapper;

    beforeEach(() => {

        http = new HttpWrapper();
        fakeRequest = { on: sandbox.stub(), end: sandbox.stub() };
        fakeResponse = { on: sandbox.stub(), headers: fakeHeaders, statusCode: 200 };
        fakeExtract = { on: sandbox.stub() };
        fakePipe = { on: sandbox.stub() };
        sandbox.replace(config, 'port', fakePort);
        sandbox.replace(config, 'host', fakeHost);
        createRequestStub = sandbox.stub(HttpWrapper.prototype, 'createRawRequest');
        readablePipeStub = sandbox.stub(Readable.prototype, 'pipe');
        extractStub = sandbox.stub(unzip, 'Extract');
        sandbox.stub(ProgressBar.prototype, 'tick').returns();
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should download from ftp', async () => {

        fakeResponse.on.withArgs('end').yields();
        fakeResponse.on.withArgs('data').yields('fakeData');
        createRequestStub.returns(fakeRequest).yields(fakeResponse);
        fakePipe.on.withArgs('close').yields('');
        readablePipeStub.returns(fakePipe);
        extractStub.returns(fakeExtract);

        const result = await helpers.downloadFromFTP(http, fakeHeaders, fakeDestination);

        sandbox.assert.callOrder(createRequestStub, extractStub, readablePipeStub);
        expect(result).to.be.deep.include('Download completed.');
    });

    it('should return expected result if error', async () => {

        createRequestStub.returns(fakeRequest).yields(fakeResponse);
        readablePipeStub.throws('fakeErr');
        extractStub.returns(fakeExtract);

        try {

            await helpers.downloadFromFTP(http, fakeHeaders, fakeDestination);
        }
        catch (err) {

            return expect(err).to.be.deep.equal('Download error.');
        }

        chai.assert.fail('readStream.pipe function should throw download error');
    });

    it('should return expected statusMessage if error response status code', async () => {

        fakeResponse.statusCode = 423;
        fakeResponse.statusMessage = 'Fake error';
        fakeResponse.on.withArgs('end').yields();
        fakeResponse.on.withArgs('data').yields('');
        createRequestStub.returns(fakeRequest).yields(fakeResponse);

        try {

            await helpers.downloadFromFTP(http, fakeHeaders, fakeDestination);
        }
        catch (err) {

            return expect(err).to.be.deep.equal('Fake error');
        }

        chai.assert.fail('Http request function should throw status error');
    });
});
