'use strict';

import Context from '../context';
import Receiver from './receiver';
import { OutputColor } from '../models';
import NormalConfigStrategy from './strategies/config/normal-config-strategy';
import DomainConfigStrategy from './strategies/config/domain-config-strategy';
import ProjectNameConfigStrategy from './strategies/config/project-name-config-strategy';
import MemberConfigStrategy from "./strategies/config/member-config-strategy";

class ConfigReceiver extends Receiver {

    private strategy!: NormalConfigStrategy | DomainConfigStrategy | ProjectNameConfigStrategy | MemberConfigStrategy;

    constructor(context: Context) {
        super(context);

        this.context.registerNonArgFlags(['enable-ssl', 'global', 'leave', 'unset', 'list']);
        this.context.registerFlagExpansions({ '-ls': '--list' })
    }

    async changeConfig(): Promise<void> {
        const [name, value] = this.context.args;
        const flags = this.context.getParsedFlags();
        this.setStrategy(name);

        try {
            if (flags.unset) {
                const result = await this.strategy.unsetValue(name, value);
                this.result.addTextLine(result || `Config key '${name}' has been deleted.`);
            } else {
                const result = await this.strategy.setValue(name, value);
                if (Array.isArray(result)) this.result.addTable(result);
                else this.result.addTextLine(result || `Config value '${name}' has been set to '${this.context.mdbConfig.getValue(name)}'.`);
            }
        } catch (e) {
            this.result.addAlert(OutputColor.Red, 'Error', `Could not change config: ${e.message}`);
        }
    }

    setStrategy(name: string): void {

        switch (name) {
            case 'domain':
                this.strategy = new DomainConfigStrategy(this.context, this.result);
                break;

            case 'projectName':
                this.strategy = new ProjectNameConfigStrategy(this.context, this.result);
                break;

            case 'member':
                this.strategy = new MemberConfigStrategy(this.context, this.result);
                break;

            default:
                this.strategy = new NormalConfigStrategy(this.context, this.result);
                break;
        }
    }
}

export default ConfigReceiver;
