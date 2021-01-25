'use strict';

const OutputPrinter = require('../../utils/output-printer');
const sandbox = require('sinon').createSandbox();

describe('OutputPrinter', () => {

    let printer;

    beforeEach(() => {

        printer = new OutputPrinter();
        sandbox.stub(console, 'log');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('should print results in console', function () {

        it('should print console log text', function () {

            printer.print([{messages: [
                {type: 'text', value: 'message'},
                {type: 'text', value: 'message2'}
            ]}]);

            expect( console.log.calledTwice ).to.be.true;
        });

        it('should print console table', function () {

            sandbox.stub(console, 'table');
            printer.print([{messages: [
                {type: 'table', value: 'message'},
                {type: 'table', value: 'message2'}
            ]}]);

            expect( console.table.calledTwice ).to.be.true;
        });

        it('should print console log alert', function () {

            printer.print([{messages: [
                {type: 'alert', color: 'red', value: {title: 'title', body: 'body'}},
                {type: 'alert', color: 'green', value: {title: 'title2', body: 'body2'}}
            ]}]);

            expect( console.log.calledTwice ).to.be.true;
        });

        it('should print console log', function () {

            printer.print([{messages: [
                {value: 'message'},
                {value: 'message2'}
            ]}]);

            expect( console.log.calledTwice ).to.be.true;
        });
    });
});
