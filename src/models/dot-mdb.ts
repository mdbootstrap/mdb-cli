import { ProjectEntry } from './project-entry';

export interface DotMdb {
    meta?: {
        starter?: string,
        type: string
    },
    backend?: {
        platform: string
    },
    wordpress?: {
        email: string,
        username: string
    },
    projectName?: string,
    hash?: string,
    domain?: string,
    publishMethod?: 'ftp' | 'pipeline',
    packageManager?: 'npm' | 'yarn',
    compose?: {
        projects: ProjectEntry[]
    }
}

export const DOT_MDB_SCHEME: DotMdb = {
    backend: { platform: '' },
    compose: { projects: [] },
    domain: '',
    meta: { starter: '', type: '' },
    packageManager: 'npm',
    projectName: '',
    hash: '',
    publishMethod: 'ftp',
    wordpress: { email: '', username: '' }
};

export interface DotMdbGlobal {
    packageManager?: 'npm' | 'yarn',
}

export const DOT_MDB_GLOBAL_SCHEME: DotMdbGlobal = {
    packageManager: 'npm'
};
