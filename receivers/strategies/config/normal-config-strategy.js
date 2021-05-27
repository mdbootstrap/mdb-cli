'use strict';

class NormalConfigStrategy {

    constructor(context, result) {
        this.context = context;
        this.result = result;
    }

    setValue(name, value) {
        this.context.mdbConfig.setValue(name, value);
        this.context.mdbConfig.save();
    }

    unsetValue(name) {
        this.context.mdbConfig.unsetValue(name);
        this.context.mdbConfig.save();
    }
}

module.exports = NormalConfigStrategy;
