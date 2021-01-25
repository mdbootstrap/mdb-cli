'use strict';

const Context = require('../../context');
const Command = require('../../commands/command');
const sandbox = require('sinon').createSandbox();

describe('Command: parent', () => {

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should throw an error when execute() method not overridden', function (done) {

        const context = new Context('', '', '', []);
        const command = new Command(context);
        try {
            command.execute();
            done(new Error('execute() method should throw error'))
        } catch (e) {
            done();
        }
    });

    it('should delegate print task to OutputPrinter', function () {

        const context = new Context('', '', '', []);
        const command = new Command(context);
        sandbox.stub(command.output, 'print');

        const fakeResults = [];
        command.printResult(fakeResults);

        expect(command.output.print).to.have.been.calledWith(fakeResults);
    });

    it('should have assigned entity, arg and flags', function () {

        const fakeEntity = 'fake';
        const fakeArgs = ['fake'];
        const fakeFlags = ['--fake'];
        const context = new Context(fakeEntity, '', fakeArgs, fakeFlags);
        const command = new Command(context);

        expect(command.entity).to.eq(fakeEntity);
        expect(command.args).to.deep.eq(fakeArgs);
        expect(command.flags).to.eq(fakeFlags);
    });
});
