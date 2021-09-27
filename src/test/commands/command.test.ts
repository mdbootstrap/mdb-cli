'use strict';

import Context from '../../context';
import Command from '../../commands/command';
import { createSandbox } from 'sinon';
import { expect } from 'chai';
import CommandResult from '../../utils/command-result';
import fs from 'fs';

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

    describe('Method: requireDotMdb()', () => {

        it('should require `.mdb` file', () => {

            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(process, 'cwd').returns('/test/location');

            const context = new Context('', '', [], []);
            // @ts-ignore
            const command = new Command(context);

            command.requireDotMdb();

            try {

                command.requireDotMdb();
            } catch (err) {

                sandbox.assert.fail('requireDotMdb() should not throw an error');
            }            
        });

        it('should throw if `.mdb` file found in wrong location', () => {

            sandbox.stub(fs, 'existsSync').onFirstCall().returns(false).onSecondCall().returns(true);
            sandbox.stub(process, 'cwd').returns('/test/location');

            const context = new Context('', '', [], []);
            // @ts-ignore
            const command = new Command(context);

            try {

                command.requireDotMdb();
            } catch (err) {

                expect(err.message).to.include('Required .mdb file found at');
                return;
            }

            sandbox.assert.fail('requireDotMdb() should throw an error');
        });

        it('should throw if `.mdb` file not found', () => {

            sandbox.stub(fs, 'existsSync').returns(false);
            sandbox.stub(process, 'cwd').returns('/test/location');

            const context = new Context('', '', [], []);
            // @ts-ignore
            const command = new Command(context);

            try {

                command.requireDotMdb();
            } catch (err) {

                expect(err.message).to.include('Required .mdb file not found');
                return;
            }

            sandbox.assert.fail('requireDotMdb() should throw an error');
        });
    });
});
