#! /usr/bin/env node
'use strict';

import CommandInvoker from './command-invoker';
import CommandResult from './utils/command-result';
import { OutputColor } from './models/output-color';
import OutputPrinter from './utils/output-printer';
import path from 'path';

require('babel-polyfill');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

if (!process.version.match(/v[1-9][0-9]/)) {

    require('console.table');
}

class Application {

    public invoker = new CommandInvoker();
    public result = new CommandResult();
    public output = new OutputPrinter();

    constructor() {

        this.result.on('mdb.cli.live.output', (msg: CommandResult) => {
            this.output.print([msg]);
        });
    }

    async run(): Promise<void> {
        try {
            this.invoker.parse(process.argv);
            await this.invoker.executeCommand();
        } catch (e) {
            this.result.liveAlert(OutputColor.Red, 'Error', `Could not process your request: ${e.message || e}`);
            if (process.argv.some((arg: string) => arg === '--debug')) {
                console.trace(e);
            }
        }
    }
}

const app = new Application();
app.run();
