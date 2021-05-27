'use strict';

const Receiver = require('./receiver');
const NormalConfigStrategy = require('./strategies/config/normal-config-strategy');
const DomainConfigStrategy = require('./strategies/config/domain-config-strategy');
const ProjectNameConfigStrategy = require('./strategies/config/project-name-config-strategy');

class ConfigReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.strategy = null;
        this.context.registerNonArgFlags(['unset', 'enable-ssl']);
    }

    async changeConfig() {
        const [name, value] = this.context.args;
        const flags = this.context.getParsedFlags();
        this.setStrategy(name);

        try {
            if (flags.unset) {
                this.strategy.unsetValue(name);
                this.result.addTextLine(`Config key '${name}' has been deleted.`);
            } else {
                await this.strategy.setValue(name, value);
                this.result.addTextLine(`Config value '${name}' has been set to '${this.context.mdbConfig.getValue(name)}'.`);
            }
        } catch (e) {
            this.result.addAlert('red', 'Error', `Could not change config: ${e.message}`);
        }
    }

    setStrategy(name) {

        switch (name) {
            case 'domain':
                this.strategy = new DomainConfigStrategy(this.context, this.result);
                break;

            case 'projectName':
                this.strategy = new ProjectNameConfigStrategy(this.context, this.result);
                break;

            default:
                this.strategy = new NormalConfigStrategy(this.context, this.result);
                break;
        }
    }
}

module.exports = ConfigReceiver;

