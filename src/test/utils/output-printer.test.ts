'use strict';

import OutputPrinter from "../../utils/output-printer";
import { expect } from 'chai';
import { createSandbox, SinonStub } from 'sinon';
import CommandResult from "../../utils/command-result";
import { OutputColor } from "../../models/output-color";

describe('OutputPrinter', () => {

    const sandbox = createSandbox();

    let printer: OutputPrinter,
        consoleLogStub: SinonStub,
        consoleTableStub: SinonStub;

    beforeEach(() => {

        printer = new OutputPrinter();

        consoleLogStub = sandbox.stub(console, 'log');
        consoleTableStub = sandbox.stub(console, 'table');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('should print results in console', function () {

        it('should print console log text', function () {

            let results: CommandResult = new CommandResult();

            results.addTextLine('message');
            results.addTextLine('message2');

            printer.print([results]);

            expect( consoleLogStub.calledTwice ).to.be.true;
        });

        it('should print console table', function () {

            let results: CommandResult = new CommandResult();

            results.addTable([{message: 'message'}]);
            results.addTable([{message: 'message'}]);

            printer.print([results]);

            expect( consoleTableStub.calledTwice ).to.be.true;
        });

        it('should print console log alert', function () {

            let results: CommandResult = new CommandResult();

            results.addAlert(OutputColor.Red, 'title', 'body');
            results.addAlert(OutputColor.Green, 'title2', 'body2');

            printer.print([results]);

            expect( consoleLogStub.calledTwice ).to.be.true;
        });
    });
});
