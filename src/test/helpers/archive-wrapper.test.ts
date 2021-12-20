'use strict';

import { expect } from "chai";
import { archiveProject } from "../../helpers/archiver-wrapper";

describe('Helper: archiveProject', () => {

    it('should call archiver and return object', () => {

        const archive = archiveProject('zip', { zlib: { level: 9 } });

        expect(archive).to.be.an('Object');
        // @ts-ignore
        expect(archive._format).to.eq('zip');
        // @ts-ignore
        expect(archive.options.zlib.level).to.eq(9);
    });
});
