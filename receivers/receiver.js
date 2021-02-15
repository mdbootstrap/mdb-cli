'use strict';

const HttpWrapper = require('../utils/http-wrapper');
const CommandResult = require('../utils/command-result');
const GitManager = require('../utils/managers/git-manager');
const config = require('../config');

class Receiver {

    constructor(context) {
        this.context = context;

        this.http = new HttpWrapper();
        this.git = new GitManager();

        this._result = new CommandResult();
    }

    get result() {
        return this._result;
    }

    clearResult() {
        this._result = new CommandResult();
    }

    static async detectEntity(context) {

        context.registerFlagExpansions({ '-n': '--name' });
        context.authenticateUser();

        let entity = '';

        const http = new HttpWrapper();
        const args = context.args;
        const flags = context.getParsedFlags();
        const options = {
            port: config.port,
            hostname: config.host,
            headers: { Authorization: `Bearer ${context.userToken}` }
        };

        const projectName = args[0] || flags.name;

        if (projectName) {
            options.path = '/project/entity/' + projectName;

            try {
                const result = await http.get(options);

                entity = JSON.parse(result.body).entity;
            } catch(e) {
                throw new Error(`Could not auto-detect entity. Please provide it manually or run mdb help. Error: ${e.message}`);
            }
        }

        return entity;
    }
}

module.exports = Receiver;
