'use strict';

const PublishHandler = require('../utils/publish-handler');
const Command = require('./command');

class PublishCommand extends Command {

    constructor() {

        super();

        this.handler = new PublishHandler();

        this.setAuthHeader();
    }

    execute() {

        this.handler.setProjectName()
            .then(() => this.handler.publish())
            .then(() => {

                this.result = this.handler.getResult();

                this.print();
            })
            .catch(console.error);
    }
}

module.exports = new PublishCommand();
