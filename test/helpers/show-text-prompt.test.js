'use strict';

const { showTextPrompt } = require('../../helpers/show-text-prompt');
const sandbox = require('sinon').createSandbox();
const inquirer = require('inquirer');

describe('Helper: show text prompt', () => {

    const fakeAnswer = 'fakeAnswer';

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

        expect(showTextPrompt('', '')).to.be.a('promise');
    });

    it('should return expected result', async () => {

        createPromptModuleStub.returns(() => Promise.resolve({ answer: fakeAnswer }));

        const result = await showTextPrompt('', '');

        expect(result).to.be.equal(fakeAnswer);
    });
});