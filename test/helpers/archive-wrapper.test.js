'use strict';

const { archiveProject } = require('../../helpers/archiver-wrapper');

describe('Helper: archiveProject', () => {

    it('should call archiver and return object', () => {

        const archive = archiveProject('zip', { zlib: { level: 9 } });

        expect(archive).to.be.an('Object');
        expect(archive._format).to.eq('zip');
        expect(archive.options.zlib.level).to.eq(9);
    });
});
