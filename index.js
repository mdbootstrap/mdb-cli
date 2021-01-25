#! /usr/bin/env node
'use strict';

require('babel-polyfill');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

if (!process.version.match(/v[1-9][0-9]/)) {

    require('console.table');
}

const CommandInvoker = require('./command-invoker');
const CommandResult = require('./utils/command-result');
const OutputPrinter = require('./utils/output-printer');

class Application {

    constructor() {
        this.invoker = new CommandInvoker();
        this.result = new CommandResult();
        this.output = new OutputPrinter();

        this.result.on('mdb.cli.live.output', (msg) => {
            this.output.print([msg]);
        });
    }

    async run() {
        try {
            this.invoker.parse(process.argv);
            await this.invoker.executeCommand();
        } catch (e) {
            this.result.liveAlert('red', 'Error', `Could not process your request: ${e.message || e}`);
        }
    }
}

const app = new Application();
app.run();
