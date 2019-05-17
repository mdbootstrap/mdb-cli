'use strict';

const ListHandler = require('../utils/list-handler');
const Command = require('./command');

class ListCommand extends Command {

    constructor() {

        super();

        this.options.path = '/packages/read';
        this.options.method = 'GET';
        this.options.data = '';

        this.handler = new ListHandler();

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

module.exports = new ListCommand();
