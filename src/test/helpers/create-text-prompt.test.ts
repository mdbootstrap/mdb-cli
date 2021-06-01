'use strict';

import { expect } from "chai";
import inquirer from "inquirer";
import { createSandbox, SinonStub } from "sinon";
import helpers from "../../helpers";

describe('Helper: createTextPrompt', () => {

    const sandbox = createSandbox();

    let moduleStub: any, createPrompt: SinonStub;

    beforeEach(() => {

        moduleStub = sandbox.stub().resolvesArg(0);
        createPrompt = sandbox.stub(inquirer, 'createPromptModule').returns(moduleStub);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('should create text prompt', () => {

        it('should call createPromptModule', async () => {

            await helpers.createTextPrompt('message', 'invalid message');
            expect(createPrompt).to.be.calledOnce;
        });

        it('should call createPromptModule with expected args', async () => {

            await helpers.createTextPrompt('message', 'invalid message');

            const arg = moduleStub.getCall(0).args[0];
            expect(arg).to.be.an('array');
            expect(arg[0]).to.be.an('object').that.have.all.keys('message', 'name', 'type', 'validate');

            const [obj] = arg;
            expect(obj.message).to.eq('message');
            expect(obj.name).to.eq('answer');
            expect(obj.type).to.eq('text');
            expect(typeof obj.validate).to.eq('function');
        });
    });
});
