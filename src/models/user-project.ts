export type UserProject = {
    project: { projectId: number },
    role: { name: string },
    user: { userNicename: string, userId: number }
};

export type Member = {
    Username: string,
    Role: string
};