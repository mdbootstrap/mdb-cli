import Context from '../../../context';
import ConfigStrategy from './config-strategy';

export class ProjectNameConfigStrategy extends ConfigStrategy {

    constructor(private readonly context: Context) {
        super();
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
