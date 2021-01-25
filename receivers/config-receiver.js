'use strict';

const Receiver = require('./receiver');

class ConfigReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.context.registerNonArgFlags(['unset']);
    }

    changeConfig() {
        const [name, value] = this.context.args;
        const flags = this.context.getParsedFlags();

        if (flags.unset) {
            this.context.mdbConfig.unsetValue(name);
            this.result.addTextLine(`Config key '${name}' has been deleted.`);
        } else {
            this.context.mdbConfig.setValue(name, value);
            this.result.addTextLine(`Config value '${name}' has been set to '${value}'.`);
        }

        this.context.mdbConfig.save();
    }
}

module.exports = ConfigReceiver;

