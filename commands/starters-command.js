'use strict';

const Command = require('./command');
const StarterReceiver = require('../receivers/starter-receiver');

class StartersCommand extends Command {

    constructor(context) {
        super(context);

        this.receiver = new StarterReceiver(context);
    }

    execute() {
        // TODO: implement
    }
}

module.exports = StartersCommand;
