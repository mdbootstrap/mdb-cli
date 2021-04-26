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
            if (name === 'domain') this.validateDomain(value);
            this.context.mdbConfig.setValue(name, value);
            this.result.addTextLine(`Config value '${name}' has been set to '${value}'.`);
        }

        this.context.mdbConfig.save();
    }

    validateDomain(value) {

        if (!/^(?=.{4,255}$)([a-zA-Z0-9_]([a-zA-Z0-9_-]{0,61}[a-zA-Z0-9_])?\.){1,126}[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/.test(value)) {
            throw new Error('Invalid domain name. Do not add the http(s):// part. If you are using *.mdbgo.io subdomain, don\'t omit the .mdbgo.io part as it won\'t work without it.');
        }
        this.result.addAlert('yellow', 'Warning!', 'To update the domain name on the remote server, you must publish your project again.');
    }
}

module.exports = ConfigReceiver;

