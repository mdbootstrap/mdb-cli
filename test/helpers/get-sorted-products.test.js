'use strict';

const { getSorted } = require('../../helpers/get-sorted-products');
const sandbox = require('sinon').createSandbox();

describe('Helper: get sorted products', () => {

    let array;
    let key;

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should throw TypeError', () => {

        expect(getSorted).to.throw(TypeError, 'Cannot read property \'slice\' of undefined');
    });

    it('should call slice on array', () => {

        array = [];
        key = '';
        const sortSpy = sandbox.spy(array, 'slice');

        getSorted(array, '');

        expect(sortSpy.calledOnce).to.be.true;
    });

    it('should call sort on array', () => {

        array = [];
        key = '';
        const fakeArray = [];
        sandbox.stub(array, 'slice').returns(fakeArray);
        const sortSpy = sandbox.spy(fakeArray, 'sort');

        getSorted(array, '');

        expect(sortSpy.calledOnce).to.be.true;
    });

    describe('should return empty array', () => {

        afterEach(() => expect(getSorted(array, key)).to.be.an('array').that.is.empty);

        it('if empty parameters', () => {

            array = [];
            key = '';
        });

        it('if array empty', () => {

            array = [];
            key = 'fakeKey';
        });
    });

    describe('should return expected result', () => {

        let expectedResult;

        beforeEach(() => {

            key = '';
        });

        afterEach(() => expect(getSorted(array, key)).to.deep.equal(expectedResult));

        it('if only array given', () => {

            const fakeObject = { fakeKey: '' };

            array = [fakeObject];
            expectedResult = array;
        });

        it('if two arguments given without brackets', () => {

            const fakeObject = { fakeKey: '1', fakeKeySec: '0' };
            const fakeObjectSec = { fakeKey: '0', fakeKeySec: '1' };

            array = [fakeObject, fakeObjectSec];
            key = 'fakeKey';
            expectedResult = array;
        });

        it('if two arguments given with brackets', () => {

            const fakeObject = { fakeKey: '0 (1)', fakeKeySec: '0' };
            const fakeObjectSec = { fakeKey: '1 (0)', fakeKeySec: '1' };

            array = [fakeObject, fakeObjectSec];
            key = 'fakeKey';
            expectedResult = [fakeObjectSec, fakeObject];
        });

        it('if other key given', () => {

            const fakeObject = { fakeKey: '1', fakeKeySec: '1 (0)' };
            const fakeObjectSec = { fakeKey: '0', fakeKeySec: '0 (1)' };

            array = [fakeObject, fakeObjectSec];
            key = 'fakeKeySec';
            expectedResult = array;
        });
    });
});
