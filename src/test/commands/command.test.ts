'use strict';

import Context from '../../context';
import Command from '../../commands/command';
import { createSandbox } from 'sinon';
import { expect } from 'chai';
import CommandResult from '../../utils/command-result';

describe('Command: parent', () => {

    const sandbox = createSandbox();

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should throw an error when execute() method not overridden', function (done) {

        const context = new Context('', '', [], []);
        // @ts-ignore
        const command = new Command(context);
        try {
            command.execute();
            done(new Error('execute() method should throw error'))
        } catch (e) {
            done();
        }
    });

    it('should delegate print task to OutputPrinter', function () {

        const context = new Context('', '', [], []);
        // @ts-ignore
        const command = new Command(context);
        sandbox.stub(command._output, 'print');

        const fakeResults = new CommandResult();
        command.printResult(fakeResults);

        expect(command._output.print).to.have.been.calledWith(fakeResults);
    });

    it('should have assigned entity, arg and flags', function () {

        const fakeEntity = 'fake';
        const fakeArgs = ['fake'];
        const fakeFlags = ['--fake'];
        const context = new Context(fakeEntity, '', fakeArgs, fakeFlags);
        // @ts-ignore
        const command = new Command(context);

        expect(command.entity).to.eq(fakeEntity);
        expect(command.args).to.deep.eq(fakeArgs);
        expect(command.flags).to.eq(fakeFlags);
    });
});
