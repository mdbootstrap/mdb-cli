'use strict';

const inquirer = require('inquirer');
const { createListPrompt } = require('../../helpers/create-list-prompt');
const sandbox = require('sinon').createSandbox();

describe('Helper: createListPrompt', () => {

    let moduleStub, createPrompt;

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

            await createListPrompt('message', ['choice']);
            expect(createPrompt).to.be.calledOnce;
        });

        it('should call createPromptModule with expected args', async () => {

            await createListPrompt('message', ['choice']);
            expect(moduleStub).to.have.been.calledWith([{ type: 'list', name: 'name', message: 'message', choices: ['choice'] }]);
        });
    });
});
