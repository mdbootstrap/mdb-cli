'use strict';

const { showConfirmationPrompt } = require('../../helpers/show-confirmation-prompt');
const inquirer = require('inquirer');

describe('Helper: show confirmation prompt', () => {

    let createPromptModuleStub;

    beforeEach(() => {

        createPromptModuleStub = sinon.stub(inquirer, 'createPromptModule');
    });

    afterEach(() => {

        createPromptModuleStub.reset();
        createPromptModuleStub.restore();
    });


    it('should return promise', (done) => {

        createPromptModuleStub.returns(() => Promise.resolve({}));

        expect(showConfirmationPrompt('')).to.be.a('promise');

        done();
    });

    it('should return true', async () => {

        createPromptModuleStub.returns(() => Promise.resolve({answer: true}));

        let result = await showConfirmationPrompt('');

        chai.assert(result === true, `returned ${result} should return true`);

        createPromptModuleStub.reset();
    });

    it('should return false', async () => {

        createPromptModuleStub.returns(() => Promise.resolve({answer: false}));

        let result = await showConfirmationPrompt('');

        chai.assert(result === false, `returned ${result} should return false`);

        createPromptModuleStub.reset();
    });

});
