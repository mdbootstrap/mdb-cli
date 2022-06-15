import { ProjectMeta } from './project-meta';
import { ProjectStatus } from './project-status';

export interface Project {
    projectId: number,
    projectName: string,
    domainName: string | null,
    publishDate: string,
    editDate: string,
    repoUrl: string | null,
    status: ProjectStatus,
    projectMeta: ProjectMeta[]
    user: {
        userNicename: string
    },
    collaborationRole: {
        name: string
    }
}
