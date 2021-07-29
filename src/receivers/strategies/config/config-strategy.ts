import { Member } from '../../../models/user-project';

abstract class ConfigStrategy {

    abstract setValue(name: string, value: string): string | Promise<string | Member[]>;

    abstract unsetValue(name: string, value?: string): string | Promise<string>;
}

export default ConfigStrategy;
