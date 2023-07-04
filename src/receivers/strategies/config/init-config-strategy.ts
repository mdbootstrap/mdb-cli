import config from '../../../config';
import Context from '../../../context';
import helpers from '../../../helpers';
import ConfigStrategy from './config-strategy';

export class InitConfigStrategy extends ConfigStrategy {

    constructor(private readonly context: Context) {
        super();
    }

    async setValue(name: string, value: string) {
        const flags = this.context.getParsedFlags();

        const projectName = flags.name ? flags.name as string : await helpers.createTextPrompt('Enter project name', 'Project name must be less than 61 characters long and be composed of only small letters, digits and these special characters: - and _', (v: string) => /^[a-z0-9_-]+$/.test(v));
        this.context.mdbConfig.setValue('projectName', projectName);
        const projectType = flags.type ? flags.type as string : await helpers.createListPrompt('Choose project type', config.projectTypes);
        this.context.mdbConfig.setValue('meta.type', projectType);
        if (projectType === 'backend') {
            const technology = flags.platform && config.backend.technologies.includes(flags.platform as string) ? flags.platform as string : await helpers.createListPrompt('Choose project technology', config.backend.technologies);
            this.context.mdbConfig.setValue('backend.platform', technology);
        }
        if (projectType === 'frontend') {
            const packageManager = await helpers.createListPrompt('Choose default package manager', ['npm', 'yarn']);
            this.context.mdbConfig.setValue('packageManager', packageManager);
        }
        this.context.mdbConfig.setValue('hash', helpers.generateRandomString());
        this.context.mdbConfig.save();

        return 'Configuration saved.';
    }

    unsetValue(name: string): string {

        throw new Error('Invalid flag --unset for `mdb config init` command.');
    }
}
