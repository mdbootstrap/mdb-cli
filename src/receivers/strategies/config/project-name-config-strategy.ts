import Context from '../../../context';
import CommandResult from '../../../utils/command-result';
import ConfigStrategy from "./config-strategy";

class ProjectNameConfigStrategy extends ConfigStrategy {

    private context: Context;
    private result: CommandResult;

    constructor(context: Context, result: CommandResult) {
        super();

        this.context = context;
        this.result = result;
    }

    async setValue(name: string, value: string): Promise<string> {
        if (this.context.packageJsonConfig && Object.keys(this.context.packageJsonConfig).length > 0) {
            this.context.setPackageJsonValue('name', value);
        }

        this.context.mdbConfig.setValue(name, value);
        this.context.mdbConfig.save();

        return '';
    }

    unsetValue(name: string): string {
        this.context.mdbConfig.unsetValue(name);
        this.context.mdbConfig.save();

        return '';
    }
}

export default ProjectNameConfigStrategy;
