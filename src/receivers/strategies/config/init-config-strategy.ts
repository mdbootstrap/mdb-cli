import config from '../../../config';
import Context from '../../../context';
import helpers from '../../../helpers';
import ConfigStrategy from './config-strategy';

export class InitConfigStrategy extends ConfigStrategy {

    constructor(private readonly context: Context) {
        super();
    }

    async setValue(name: string, value: string) {

        const projectName = await helpers.createTextPrompt('Enter project name', 'Project name must not be empty');
        this.context.mdbConfig.setValue('projectName', projectName);
        const projectType = await helpers.createListPrompt('Choose project type', ['frontend', 'backend', 'wordpress']);
        this.context.mdbConfig.setValue('meta.type', projectType);
        if (projectType === 'backend') {
            const technology = await helpers.createListPrompt('Choose project technology', config.backendTechnologies);
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
