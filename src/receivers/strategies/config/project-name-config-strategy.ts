import Context from '../../../context';
import CommandResult from '../../../utils/command-result';

class ProjectNameConfigStrategy {

    private context: Context;
    private result: CommandResult;

    constructor(context: Context, result: CommandResult) {
        this.context = context;
        this.result = result;
    }

    async setValue(name: string, value: string): Promise<void> {
        if (this.context.packageJsonConfig && Object.keys(this.context.packageJsonConfig).length > 0) {
            this.context.setPackageJsonValue('name', value);
        }

        this.context.mdbConfig.setValue(name, value);
        this.context.mdbConfig.save();
    }

    unsetValue(name: string): void {
        this.context.mdbConfig.unsetValue(name);
        this.context.mdbConfig.save();
    }
}

export default ProjectNameConfigStrategy;
