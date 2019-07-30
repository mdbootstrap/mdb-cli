'use strict';

const ListHandler = require('../utils/list-handler');
const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');

class ListCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.options.path = '/packages/read';
        this.options.method = 'GET';
        this.options.data = '';

        this.handler = new ListHandler(authHandler);

        this.setAuthHeader();
    }

    execute() {

        return this.handler.fetchProducts()
            .then(() => {

                this.result = this.handler.getResult();

                this.print();
            })
            .catch(console.error);
    }
}

module.exports = ListCommand;
