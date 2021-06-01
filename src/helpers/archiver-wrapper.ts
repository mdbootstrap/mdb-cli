'use strict';

import archiver, { Archiver, ArchiverOptions, Format } from 'archiver';

function archiveProject(format: Format, options: ArchiverOptions): Archiver {

    return archiver(format, options);
}

export default archiveProject;