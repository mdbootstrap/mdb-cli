'use strict';

const sandbox = require('sinon').createSandbox();
const helpers = require('../../helpers');
const { createJenkinsfile } = helpers;
const fs = require('fs');

describe('Helper: create jenkinsfile', () => {

    let existsSyncStub, writeFileSyncStub, deserializeJsonFileStub;

    const fakePath = 'fakePath';

    beforeEach(() => {

        deserializeJsonFileStub = sandbox.stub(helpers, 'deserializeJsonFile');
        writeFileSyncStub = sandbox.stub(fs, 'writeFileSync');
        existsSyncStub = sandbox.stub(fs, 'existsSync');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should resolve if the Jenkinsfile already exists', async () => {

        existsSyncStub.returns(true);

        await createJenkinsfile(fakePath);

        sandbox.assert.notCalled(writeFileSyncStub);
    });

    it('should call writeFileSync on jq project', async () => {

        existsSyncStub.returns(false);
        deserializeJsonFileStub.resolves({});

        await createJenkinsfile(fakePath);

        sandbox.assert.calledOnce(writeFileSyncStub);
    });

    it('should call writeFileSync on ARV project', async () => {

        existsSyncStub.returns(false);
        deserializeJsonFileStub.resolves({ scripts: { test: 'fake test' }, dependencies: { vue: '1.2.3' } });

        await createJenkinsfile(fakePath, true);

        sandbox.assert.calledOnce(writeFileSyncStub);
    });
});
