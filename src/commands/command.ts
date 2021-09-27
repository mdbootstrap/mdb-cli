'use strict';

import { join } from 'path';
import { existsSync } from 'fs';
import OutputPrinter from '../utils/output-printer';
import CommandResult from '../utils/command-result';
import Context from '../context';

abstract class Command {

    public args: string[];
    public entity: string;
    public flags: string[];
    public results: CommandResult = new CommandResult();

    private _output: OutputPrinter = new OutputPrinter();

    protected constructor(context: Context) {
        this.args = context.args;
        this.entity = context.entity;
        this.flags = context.rawFlags;
    }

    abstract execute(): void | Promise<void>;

    /**
     * @param results: CommandResult[]
     */
    printResult(results: CommandResult[]): void {
        this._output.print(results);
    }

    requireDotMdb() {
        let cwd = process.cwd();
        const requiredPath = join(cwd, '.mdb')

        while (true) {

            let dotMdbPath = join(cwd, '.mdb');
            if (existsSync(dotMdbPath)) {
                if (dotMdbPath !== requiredPath)
                    throw new Error(`Required .mdb file found at ${dotMdbPath} - please change your current working directory and run the command again.`);
                return;
            }
            cwd = join(cwd, '..')
            if (dotMdbPath === '/.mdb' || dotMdbPath === '\\.mdb') break;
        }

        throw new Error('Required .mdb file not found. Probably not an mdb project - please change directory or initialize new project with `mdb init` command.');
    }
}

export default Command;
