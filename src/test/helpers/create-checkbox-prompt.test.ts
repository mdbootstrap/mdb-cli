import { expect } from "chai";
import inquirer from "inquirer";
import { createSandbox, SinonStub } from "sinon";
import helpers from "../../helpers";

describe('Helper: createCheckboxPrompt', () => {

    const sandbox = createSandbox();

    let moduleStub: any, createPrompt: SinonStub;

    beforeEach( () => {

        moduleStub = sandbox.stub().resolvesArg(0);
        createPrompt = sandbox.stub(inquirer, 'createPromptModule').returns(moduleStub);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('should create list prompt', () => {

        it('should call createPromptModule', async () => {

            await helpers.createCheckboxPrompt('message', ['choice']);
            expect(createPrompt).to.be.calledOnce;
        });

        it('should call createPromptModule with expected args', async () => {

            await helpers.createCheckboxPrompt('message', ['choice']);
            expect(moduleStub).to.have.been.calledWith([{ type: 'checkbox', name: 'name', message: 'message', choices: ['choice'] }]);
        });
    });
});
