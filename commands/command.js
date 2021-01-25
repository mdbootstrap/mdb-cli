'use strict';

const OutputPrinter = require('../utils/output-printer');

class Command {

    constructor(context) {
        this.output = new OutputPrinter();

        this.entity = context.entity;
        this.args = context.args;
        this.flags = context.rawFlags;
    }

    execute() {
        throw new Error('This method should be implemented in child-classes.');
    }

    /**
     * @param results: CommandResult[]
     */
    printResult(results) {
        this.output.print(results);
    }
}

module.exports = Command;
