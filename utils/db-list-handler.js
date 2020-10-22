'use strict';

const config = require('../config');
const AuthHandler = require('./auth-handler');
const HttpWrapper = require('../utils/http-wrapper');

class DbListHandler {

    constructor(authHandler = new AuthHandler()) {

        this.result = [];
        this.authHandler = authHandler;
        this.options = {
            port: config.port,
            hostname: config.host,
            path: '/databases',
            headers: this.authHandler.headers
        };
    }

    getResult() {

        return this.result;
    }

    async fetchDatabases() {

        const http = new HttpWrapper(this.options);

        let databases = await http.get();
        databases = typeof databases === 'string' ? JSON.parse(databases) : databases;

        if (databases.length === 0) {

            return this.result = [{ Status: 0, Message: 'You do not have any databases yet.' }];
        }

        this.result = databases.map(db => ({
            'Database': db.database,
            'Name': db.name,
            'Username': db.username,
            'Connection String': db.connectionString,
            'Description': db.description
        }));
    }
}

module.exports = DbListHandler;
