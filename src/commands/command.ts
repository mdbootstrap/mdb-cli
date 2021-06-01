'use strict';

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
}

export default Command;
