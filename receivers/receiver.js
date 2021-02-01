'use strict';

const HttpWrapper = require('../utils/http-wrapper');
const CommandResult = require('../utils/command-result');
const GitManager = require('../utils/managers/git-manager');

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
}

module.exports = Receiver;
