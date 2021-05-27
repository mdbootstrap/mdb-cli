'use strict';

class ProjectNameConfigStrategy {

    constructor(context, result) {
        this.context = context;
        this.result = result;
    }

    async setValue(name, value) {
        if (this.context.packageJsonConfig && Object.keys(this.context.packageJsonConfig).length > 0) {
            this.context.setPackageJsonValue('name', value);
        }

        this.context.mdbConfig.setValue(name, value);
        this.context.mdbConfig.save();
    }

    unsetValue(name) {
        this.context.mdbConfig.unsetValue(name);
        this.context.mdbConfig.save();
    }
}

module.exports = ProjectNameConfigStrategy;
