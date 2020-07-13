'use strict';

const PackageManager = require('../../../utils/managers/package-manager');
const sandbox = require('sinon').createSandbox();

describe('Utils: PackageManager', () => {

    let manager;

    beforeEach(() => {

        manager = new PackageManager();
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should throw ReferenceError if manager info method is not implemented', () => {

        try {

            manager.info();
        }
        catch (err) {

            expect(err.message).to.equal('Method must be implemented in a child-class');
        }
    });

    it('should throw ReferenceError if manager init method is not implemented', () => {

        try {

            manager.init();
        }
        catch (err) {

            expect(err.message).to.equal('Method must be implemented in a child-class');
        }
    });

    it('should throw ReferenceError if manager build method is not implemented', () => {

        try {

            manager.build();
        }
        catch (err) {

            expect(err.message).to.equal('Method must be implemented in a child-class');
        }
    });

    it('should throw ReferenceError if manager update method is not implemented', () => {

        try {

            manager.update();
        }
        catch (err) {

            expect(err.message).to.equal('Method must be implemented in a child-class');
        }
    });
});