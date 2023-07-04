import { join, parse } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import OutputPrinter from '../utils/output-printer';
import CommandResult from '../utils/command-result';
import HttpWrapper from '../utils/http-wrapper';
import { OutputColor } from '../models';
import Context from '../context';
import helpers from '../helpers';
import config from '../config';

abstract class Command {

    public args: string[];
    public entity: string;
    public flags: string[];
    public results: CommandResult = new CommandResult();

    private _output: OutputPrinter = new OutputPrinter();

    protected constructor(protected context: Context) {
        this.args = context.args;
        this.entity = context.entity;
        this.flags = context.rawFlags;
    }

    abstract execute(): void | Promise<void>;

    /**
     * @param results: CommandResult[]
     */
    async printResult(results: CommandResult[]) {
        this._output.print(results);
        if (this.context.serverMessageLast) await this._printAdditionalMessage();
    }

    private async _printAdditionalMessage() {
        const lastMsg = existsSync(config.msgPath) ? readFileSync(config.msgPath, 'utf8') : '';
        if (lastMsg !== this.context.serverMessageLast) {
            writeFileSync(config.msgPath, this.context.serverMessageLast, 'utf8');
            try {
                const res = await new HttpWrapper().get({ hostname: config.host, path: '/app/message' });
                const msg = JSON.parse(res.body);
                const result = new CommandResult();
                result.addAlert(OutputColor.Yellow, msg.title, msg.body);
                this._output.print([result]);
            } catch {}
        }
    }

    async requireDotMdb() {
        let cwd = process.cwd();
        const requiredPath = join(cwd, '.mdb');
        const { root } = parse(requiredPath);

        while (true) {

            let dotMdbPath = join(cwd, '.mdb');
            if (existsSync(dotMdbPath)) {
                if (dotMdbPath !== requiredPath)
                    throw new Error(`Required .mdb file found at ${dotMdbPath} - please change your current working directory and run the command again.`);
                return;
            }
            cwd = join(cwd, '..')
            if (dotMdbPath === join(root, '.mdb')) break;
        }

        const confirmed = await helpers.createConfirmationPrompt('Required .mdb file not found. Create?', true);

        if (!confirmed) {
            throw new Error('Required .mdb file not found. Probably not an mdb project - please change directory or initialize new project with `mdb init` command.');
        }

        const flags = [];
        const isProjectTypeDeterminable = this.entity && config.projectTypes.includes(this.entity);
        if (isProjectTypeDeterminable) flags.push('-t', this.entity);
        flags.push(...this.flags);

        const context = new Context('config', 'config', ['init'], flags);

        const ConfigCommand = require('./config-command');
        await new ConfigCommand(context).execute();
        this.context.mdbConfig.load();
    }
}

export default Command;
