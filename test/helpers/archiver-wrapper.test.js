'use strict';

const { expect } = require('chai');

describe('Helper: archiverWrapper', () => {

    const { archiveProject } = require('../../helpers/archiver-wrapper');

    it('should return an instance of archiver object', async () => {

        const archive = await archiveProject('zip', { zlib: { level: 9 } });
        
        expect(archive).to.be.an('Object');
        expect(archive._format).to.eq('zip');
        expect(archive.options.zlib.level).to.eq(9);
    });
});