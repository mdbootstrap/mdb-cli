'use strict';

const Command = require('../../commands/command');
const sandbox = require('sinon').createSandbox();
const LogoutHandler = require('../../utils/logout-handler');

describe('Command: parent', () => {

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should throw ReferenceError if command handler is not set', () => {

        const command = new Command();

        try {

            command.handler();
        }
        catch (err) {

            expect(err.message).to.equal('Command handler must be set before using it');
        }
    });

    it('should throw ReferenceError if command execute method is not implemented', () => {

        const command = new Command();

        try {

            command.execute();
        }
        catch (err) {

            expect(err.message).to.equal('Method must be implemented in a child-class');
        }
    });

    it('should set args', () => {

        const command = new Command();
        const fakeArgs = { fake: 'args' };

        command.setArgs(fakeArgs);

        expect(command.args).to.equal(fakeArgs);
    });

    it('should catchError() print error if it is a table', () => {

        const command = new Command();
        const fakeError = [{ fake: 'error' }];
        const tableStub = sandbox.stub(console, 'table');

        command.catchError(fakeError);

        expect(tableStub.calledOnce).to.be.true;
    });

    it('should catchError() call set result and print error', () => {

        const command = new Command();
        const fakeError = { statusCode: 123, message: 'fake message' };
        const printStub = sandbox.stub(command, 'print');
        const expectedResult = { Status: 123, Message: 'fake message' };

        command.catchError(fakeError);

        expect(printStub.calledOnce).to.be.true;
        expect(command.result).to.deep.include(expectedResult);
    });

    it('should catchError() logout user when status code is 401', () => {

        const command = new Command();
        const fakeError = { statusCode: 401, message: 'fake message' };
        const expectedResult = { Status: 401, Message: 'Please login first' };
        const logoutStub = sandbox.stub(LogoutHandler.prototype, 'logout');
        const printStub = sandbox.stub(command, 'print');

        command.catchError(fakeError);

        expect(logoutStub.calledOnce).to.be.true;
        expect(printStub.calledOnce).to.be.true;
        expect(command.result).to.deep.include(expectedResult);
    });
});
