'use strict';

const Command = require('../../commands/command');

describe('Command: parent', () => {

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
});
