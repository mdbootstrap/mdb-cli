import { expect } from "chai";
import inquirer from "inquirer";
import { createSandbox, SinonStub } from "sinon";
import { createPassPrompt } from "../../helpers/create-pass-prompt";

describe('Helper: createPassPrompt', () => {

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

            await createPassPrompt('message', 'invalid message');
            expect(createPrompt).to.be.calledOnce;
        });

        it('should call createPromptModule with expected args', async () => {

            const validate = (v: string) => Boolean(v);
            await createPassPrompt('message', 'invalid message', validate);
            
            const arg = moduleStub.getCall(0).args[0];
            expect(arg).to.be.an('array');
            expect(arg[0]).to.be.an('object').that.have.all.keys('message', 'name', 'type', 'validate', 'mask');

            const [obj] = arg;
            expect(obj.message).to.eq('message');
            expect(obj.name).to.eq('password');
            expect(obj.type).to.eq('password');
            expect(typeof obj.validate).to.eq('function');
        });
    });
});
