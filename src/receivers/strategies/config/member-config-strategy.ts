import Context from '../../../context';
import HttpWrapper, { CustomRequestOptions } from '../../../utils/http-wrapper';
import { Member, UserProject } from '../../../models/user-project';
import ConfigStrategy from './config-strategy';
import helpers from '../../../helpers';
import config from '../../../config';

export class MemberConfigStrategy extends ConfigStrategy {

    private readonly options: CustomRequestOptions;

    constructor(private readonly context: Context) {
        super();

        this.context.authenticateUser();

        this.options = {
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };
    }

    setValue(name: string, value: string): Promise<string | Member[]> {

        const flags = this.context.getParsedFlags();

        if (flags.leave) {
            const projectName = value || this.context.mdbConfig.getValue('projectName') as string;
            this.validate(projectName, 'projectName');
            return helpers.createTextPrompt('Confirm leaving project by typing its name:', 'Project name must not be empty.')
                .then((name) => name === projectName ? this.leaveProject(projectName) : Promise.reject({ message: 'The names do not match.' }))
                .then(() => `You have been successfully removed from ${projectName} project members.`);
        } else if (flags.list) {
            const projectName = value || this.context.mdbConfig.getValue('projectName') as string;
            return this.getMembers(projectName);
        }

        this.validate(value, value.includes('@') ? 'email' : 'username');
        this.validate(flags.role as string, 'role');

        return this.addMember(value, flags.role as string)
            .then(() => `${value} has been successfully added as a project member.`);
    }

    unsetValue(name: string, value: string): Promise<string> {
        this.validate(value, value.includes('@') ? 'email' : 'username');

        return this.removeMember(value)
            .then(() => `${value} has been successfully removed from the project.`);
    }

    private validate(value: string, valueType: 'email' | 'projectName' | 'role' | 'username') {
        switch (valueType) {
            case 'email':
                if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value))
                    throw new Error('Provided email is invalid.');
                break;

            case 'projectName':
                if (!/^[a-z0-9_-]+$/.test(value)) {
                    throw new Error('Provided project name is invalid.');
                }
                break;

            case 'role':
                if (!config.memberRoles.includes(value)) {
                    throw new Error(`Provided role is invalid. Allowed values: ${config.memberRoles.join(',')}`);
                }
                break;

            case 'username':
                if (!/^[^()!|&*]+$/.test(value)) {
                    throw new Error('Provided username is invalid.');
                }
                break;
        }
    }

    private async addMember(username: string, role: string): Promise<void> {
        this.options.path = `/project/${this.context.mdbConfig.getValue('projectName')}/member`;
        this.options.data = JSON.stringify({ username, role });
        this.options.headers!['Content-Length'] = Buffer.byteLength(this.options.data);
        this.options.headers!['Content-Type'] = 'application/json';
        const http = new HttpWrapper();

        await http.post(this.options);
    }

    private async removeMember(username: string): Promise<void> {
        this.options.path = `/project/${this.context.mdbConfig.getValue('projectName')}/member/${username}`;
        const http = new HttpWrapper();

        await http.delete(this.options);
    }

    private async leaveProject(projectName: string): Promise<void> {
        this.options.path = `/project/${projectName}/member/leave`;
        const http = new HttpWrapper();

        await http.delete(this.options);
    }

    private async getMembers(projectName: string): Promise<string | Member[]> {
        this.options.path = `/project/members?projectName=${projectName}`;
        const http = new HttpWrapper();

        const result = await http.get(this.options);
        const members: Member[] = JSON.parse(result.body).map((m: UserProject) => ({ Username: m.user.userNicename, Role: m.role.name }));

        return members;
    }
}
