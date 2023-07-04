import Context from '../../context';
import helpers from '../../helpers';
import Command from '../../commands/command';
import CommandResult from '../../utils/command-result';
import HttpWrapper, { CustomOkResponse } from '../../utils/http-wrapper';
import { createSandbox } from 'sinon';
import { expect } from 'chai';
import fs from 'fs';

describe('Command: parent', () => {

    const sandbox = createSandbox();

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should throw an error when execute() method not overridden', function(done) {

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

    it('should delegate print task to OutputPrinter', function() {

        const context = new Context('', '', [], []);
        // @ts-ignore
        const command = new Command(context);
        sandbox.stub(command._output, 'print');

        const fakeResults = new CommandResult();
        command.printResult(fakeResults);

        expect(command._output.print).to.have.been.calledWith(fakeResults);
    });

    it('should print an additional server message if it exists and has not been displayed yet', async function() {

        const context = new Context('', '', [], []);
        // @ts-ignore
        const command = new Command(context);
        sandbox.stub(command._output, 'print');

        sandbox.stub(context, 'serverMessageLast').value('2020-02-02');
        sandbox.stub(HttpWrapper.prototype, 'get').resolves({ body: JSON.stringify({ title: '', body: '' }) } as CustomOkResponse);
        sandbox.stub(fs, 'existsSync').returns(false);
        const writeStub = sandbox.stub(fs, 'writeFileSync');

        const fakeResults = new CommandResult();
        await command.printResult(fakeResults);

        expect(command._output.print).to.have.been.calledWith(fakeResults);
        expect(command._output.print).to.have.been.calledTwice;
        expect(writeStub).to.have.been.calledOnce;
    });

    it('should not print an additional server message if it has already been displayed', async function() {

        const context = new Context('', '', [], []);
        // @ts-ignore
        const command = new Command(context);
        sandbox.stub(command._output, 'print');

        sandbox.stub(context, 'serverMessageLast').value('2020-02-02');
        sandbox.stub(fs, 'existsSync').returns(true);
        sandbox.stub(fs, 'readFileSync').returns('2020-02-02');
        const writeStub = sandbox.stub(fs, 'writeFileSync');

        const fakeResults = new CommandResult();
        await command.printResult(fakeResults);

        expect(command._output.print).to.have.been.calledWith(fakeResults);
        expect(command._output.print).to.have.been.calledOnce;
        expect(writeStub).to.not.have.been.called;
    });

    it('should have assigned entity, arg and flags', function() {

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

        it('should require `.mdb` file', async () => {

            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(process, 'cwd').returns('/test/location');

            const context = new Context('', '', [], []);
            // @ts-ignore
            const command = new Command(context);

            try {

                await command.requireDotMdb();
            } catch (err) {

                sandbox.assert.fail('requireDotMdb() should not throw an error');
            }
        });

        it('should throw if `.mdb` file found in wrong location', async () => {

            sandbox.stub(fs, 'existsSync').onFirstCall().returns(false).onSecondCall().returns(true);
            sandbox.stub(process, 'cwd').returns('/test/location');

            const context = new Context('', '', [], []);
            // @ts-ignore
            const command = new Command(context);

            try {

                await command.requireDotMdb();
            } catch (err) {

                expect(err.message).to.include('Required .mdb file found at');
                return;
            }

            sandbox.assert.fail('requireDotMdb() should throw an error');
        });

        it('should throw if `.mdb` file not found and user refused to create it', async () => {

            sandbox.stub(helpers, 'createConfirmationPrompt').resolves(false);
            sandbox.stub(process, 'cwd').returns('/test/location');
            sandbox.stub(fs, 'existsSync').returns(false);

            const context = new Context('', '', [], []);
            // @ts-ignore
            const command = new Command(context);

            try {

                await command.requireDotMdb();
            } catch (err) {

                expect(err.message).to.include('Required .mdb file not found');
                return;
            }

            sandbox.assert.fail('requireDotMdb() should throw an error');
        });

        it('should create a `.mdb` if not found and user wanted to create one', async () => {

            const ConfigCommand = require('../../commands/config-command');
            const executeStub = sandbox.stub(ConfigCommand.prototype, 'execute');
            sandbox.stub(helpers, 'createConfirmationPrompt').resolves(true);
            sandbox.stub(process, 'cwd').returns('/test/location');
            sandbox.stub(fs, 'existsSync').returns(false);

            const context = new Context('', '', [], []);
            // @ts-ignore
            const command = new Command(context);

            await command.requireDotMdb();

            sandbox.assert.calledOnce(executeStub);
        });

        it('should create a `.mdb` if not found and take values from command context', async () => {

            const ConfigCommand = require('../../commands/config-command');
            const executeStub = sandbox.stub(ConfigCommand.prototype, 'execute');

            sandbox.stub(helpers, 'createConfirmationPrompt').resolves(true);
            sandbox.stub(process, 'cwd').returns('/test/location');
            sandbox.stub(fs, 'existsSync').returns(false);

            const context = new Context('backend', '', [], ['-n', 'test-name',  '-p', 'test-platform']);
            // @ts-ignore
            const command = new Command(context);

            await command.requireDotMdb();

            const configCommand = executeStub.getCall(0).thisValue;

            expect(configCommand.entity).to.eq('config');
            expect(configCommand.args).to.deep.eq(['init']);
            expect(configCommand.flags).to.deep.eq(['-t', 'backend', '-n', 'test-name', '-p', 'test-platform']);
        });
    });
});
