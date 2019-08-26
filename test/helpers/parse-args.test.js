'use strict';

const { parseArgs } = require('../../helpers/parse-args');

describe('Helper: parse args', () => {

    let args;
    let initArgsMap;

    it('should throw TypeError', () => {

        expect(parseArgs).to.throw(TypeError, 'Cannot read property \'length\' of undefined');
    });

    describe('should return empty array', () => {

        afterEach(() => expect(parseArgs(args, initArgsMap)).to.be.an('object').that.is.empty);

        it('if empty parameters', () => {

            args = [];
            initArgsMap = {};
        });

        it('if args empty', () => {

            args = [];
            initArgsMap = { 'fakeArg': undefined };
        });

        it('if initArgsMap empty', () => {

            args = ['fakeArg', 'fakeArgValue'];
            initArgsMap = {};
        });

        it('if only argument name given', () => {

            args = ['fakeArg'];
            initArgsMap = { 'fakeArg': undefined };
        });
    });

    describe('should return expected result', () => {

        let expectedResult = {};

        beforeEach(() => {

            initArgsMap = {};
            expectedResult = {};
        });
        afterEach(() => expect(parseArgs(args, initArgsMap)).to.deep.equal(expectedResult));

        it('if one argument given', () => {

            const fakeArg = 'fakeArg';
            const fakeValue = 'fakeValue';

            args = [fakeArg, fakeValue];
            initArgsMap[fakeArg] = undefined;
            expectedResult[fakeArg] = fakeValue;
        });

        it('if two arguments given', () => {

            const fakeArg = 'fakeArg';
            const fakeArgSec = 'fakeArgSec';
            const fakeValue = 'fakeValue';
            const fakeValueSec = 'fakeValueSec';

            args = [fakeArg, fakeValue, fakeArgSec, fakeValueSec];
            initArgsMap[fakeArg] = undefined;
            initArgsMap[fakeArgSec] = undefined;
            expectedResult[fakeArg] = fakeValue;
            expectedResult[fakeArgSec] = fakeValueSec;
        });
    });
});
