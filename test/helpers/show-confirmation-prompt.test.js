'use strict';

const { showConfirmationPrompt } = require('../../helpers/show-confirmation-prompt');
const inquirer = require('inquirer');
const sandbox = require('sinon').createSandbox();

describe('Helper: show confirmation prompt', () => {

    let createPromptModuleStub;

    beforeEach(() => {

        createPromptModuleStub = sandbox.stub(inquirer, 'createPromptModule');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should return promise', () => {

        createPromptModuleStub.returns(() => Promise.resolve({}));

        expect(showConfirmationPrompt('')).to.be.a('promise');
    });

    it('should return true', async () => {

        createPromptModuleStub.returns(() => Promise.resolve({answer: true}));

        let result = await showConfirmationPrompt('');

        chai.assert(result === true, `returned ${result} should return true`);
    });

    it('should return false', async () => {

        createPromptModuleStub.returns(() => Promise.resolve({answer: false}));

        let result = await showConfirmationPrompt('');

        chai.assert(result === false, `returned ${result} should return false`);
    });
});
