'use strict';

const VersionCommand = require('../../commands/version-command');
const VersionHandler = require('../../utils/version-handler');
const sandbox = require('sinon').createSandbox();

describe('Command: version', () => {

    let command,
        printStub;

    beforeEach(() => {

        command = new VersionCommand();
        printStub = sandbox.stub(command, 'print');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
        expect(command.handler).to.be.an.instanceOf(VersionHandler);
    });

    it('should call print method', () => {

        command.execute();

        sandbox.assert.calledOnce(printStub);
    });
});