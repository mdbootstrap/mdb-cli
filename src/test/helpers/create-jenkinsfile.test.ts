import { createJenkinsfile } from "../../helpers/create-jenkinsfile";
import { createSandbox, SinonStub } from "sinon";
import { expect } from "chai";
import path from "path";
import fs from "fs";

describe('Helper: createJenkinsfile', () => {

    const sandbox = createSandbox();

    let existsStub: SinonStub, writeStub: SinonStub;

    beforeEach(() => {

        sandbox.stub(path, 'join').returns('/fake/path');
        existsStub = sandbox.stub(fs, 'existsSync');
        writeStub = sandbox.stub(fs, 'writeFileSync');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should create a Jenkinsfile and return true', async () => {

        existsStub.returns(false);

        const result = await createJenkinsfile('', false);

        expect(result).to.be.true;
        sandbox.assert.calledOnce(writeStub);
    });

    it('should create simple Jenkinsfile and return true', async () => {

        existsStub.returns(false);

        const result = await createJenkinsfile('', true);

        expect(result).to.be.true;
        sandbox.assert.calledOnce(writeStub);
    });

    it('should not create Jenkinsfile and return false if already exists', async () => {

        existsStub.returns(true);

        const result = await createJenkinsfile('', true);

        expect(result).to.be.false;
        sandbox.assert.notCalled(writeStub);
    });
});
