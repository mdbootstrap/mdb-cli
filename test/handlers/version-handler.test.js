'use strict';

const VersionHandler = require('../../utils/version-handler');
const sandbox = require('sinon').createSandbox();
const { version } = require('../../package.json');

describe('Handlers: Version', () => {

    let handler;

    beforeEach(() => {

        handler = new VersionHandler();
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned result', () => {

        expect(handler.result).to.be.eq(version);
    });

    it('should return expected result', () => {

        const result = handler.getResult();

        expect(result).to.be.eq(version);
    });
});
