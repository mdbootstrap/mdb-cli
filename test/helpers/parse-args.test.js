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

        const fakeArg = 'fakeArg';
        const fakeArgSec = 'fakeArgSec';
        const fakeArgName = 'fakeArgName';
        const fakeArgSecName = 'fakeArgSecName';
        const fakeValue = 'fakeValue';
        const fakeValueSec = 'fakeValueSec';

        it('if one argument given', () => {

            args = [fakeArg, fakeValue];
            initArgsMap[fakeArg] = fakeArgName;
            expectedResult[fakeArgName] = fakeValue;
        });

        it('if two arguments given', () => {

            args = [fakeArg, fakeValue, fakeArgSec, fakeValueSec];
            initArgsMap[fakeArg] = fakeArgName;
            initArgsMap[fakeArgSec] = fakeArgSecName;
            expectedResult[fakeArgName] = fakeValue;
            expectedResult[fakeArgSecName] = fakeValueSec;
        });
    });
});
