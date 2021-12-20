'use strict';

import archiver, { Archiver, ArchiverOptions, Format } from 'archiver';

export function archiveProject(format: Format, options: ArchiverOptions): Archiver {

    return archiver(format, options);
}
