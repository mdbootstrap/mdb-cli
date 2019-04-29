'use strict';

const Command = require('./command');
const LogoutHandler = require('../utils/logout-handler');

class LogoutCommand extends Command {

    constructor() {

        super();

        this.handler = new LogoutHandler();

        this.setAuthHeader();
    }

    execute() {

        return this.handler.logout()
            .then(() => {

                this.result = this.handler.getResult();

                this.print();
            })
            .catch(console.error);
    }
}

module.exports = new LogoutCommand();
