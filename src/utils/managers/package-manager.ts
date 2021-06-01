'use strict';

import childProcess from "child_process";
import {CliStatus} from "../../models/cli-status";

abstract class PackageManager {

    private isWindows = process.platform === 'win32';

    abstract get cmdCommand(): string;

    abstract init(cwd?: string): Promise<string>;

    abstract build(cwd: string): Promise<string>;

    abstract test(): Promise<string>;

    abstract update(): Promise<string>;

    protected _task(args: string[], successMsg: string, errorMsg: string, cwd?: string): Promise<string> {

        return new Promise((resolve, reject) => {
            const task = childProcess.spawn(this.cmdCommand, args, { cwd, stdio: 'inherit', ...(this.isWindows && { shell: true }) });
            task.on('error', (error: number) => reject(error));
            task.on('exit', (code: number) => code === CliStatus.SUCCESS ? resolve(successMsg) : reject(errorMsg));
        });
    }
}

export default PackageManager;
