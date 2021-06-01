'use strict';

import config from "../../config";
import childProcess, {ChildProcess} from "child_process";
import path from "path";
import fs from "fs";

import { CliStatus } from "../../models/cli-status";

class GitManager {

    private cmd = 'git';
    private cwd = process.cwd();
    private isWindows = process.platform === 'win32';

    checkout(branchName: string = 'master') {

        return this._task(['checkout', '-B', branchName], `Switched to branch ${branchName}.`, 'Problem with git branch change.');
    }

    clone(repoUrl: string, projectName?: string) {

        const gitArgs = projectName ? ['clone', repoUrl, projectName] : ['clone', repoUrl];
        return this._task(gitArgs, 'Success.', 'There were some errors. Please try again.');
    }

    async commit(filename: string, message: string) {

        try {

            await this._task(['add', filename], '', 'Problem with git add command.');
        } catch (err) {

            return Promise.reject(err);
        }

        const commitMsg = this.isWindows ? `"${message}"` : message;
        return this._task(['commit', '-m', commitMsg], '', 'Problem with git commit command.');
    }

    currentBranch() {

        return new Promise<string>((resolve, reject) => {

            const gitBranch = this._spawn(['rev-parse', '--abbrev-ref', 'HEAD']);
            gitBranch.stdout?.on('data', data => resolve(data.toString().trim()));
            gitBranch.stderr?.on('data', data => reject(data.toString()));
        });
    }

    merge(branchName: string) {

        return this._task(['merge', branchName], '', 'Problem with git branch merge.');
    }

    pull(branchName: string) {

        return new Promise<void>((resolve, reject) => {

            const gitPull = this._spawn(['pull', 'origin', branchName]);

            let result = '';

            gitPull.stdout?.on('data', data => {
                result = `\n${data}`;
                console.log(result);
            });

            gitPull.stderr?.on('data', data => {
                result = `\n${data}`;
                console.error(result);
            });

            gitPull.on('exit', code => {
                if (code === 0 || result.indexOf(`Couldn't find remote ref ${branchName}`) !== -1) resolve();
                else reject('Problem with project fetching from GitLab.');
            });
        });
    }

    push(branchName: string) {

        return this._task(['push', '-u', 'origin', branchName], '', 'Problem with uploading to GitLab.');
    }

    status() {

        return new Promise<void>((resolve, reject) => {

            const gitStatus = this._spawn(['status']);

            gitStatus.stdout?.on('data', data => {
                if (data.indexOf('nothing to commit, working tree clean') !== -1) resolve();
                else reject('You have uncommited changes in your project, please commit and try again.');
            });

            gitStatus.stderr?.on('data', data => reject(data.toString()));
        });
    }

    getCurrentRemoteUrl(): string {
        const gitConfigPath = path.join(this.cwd, '.git', 'config');
        const gitConfigContent = fs.existsSync(gitConfigPath) ? fs.readFileSync(gitConfigPath, 'utf8') : '';
        const lines = gitConfigContent.replace(/\t/g, '').split('\n');

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('[remote')) {
                const [, url] = lines[i + 1].split(' = ');
                if (url.startsWith(config.gitlabUrl)) return url;
            }
        }

        return '';
    }

    setOrigin(origin: string) {

        return this._task(['remote', 'set-url', 'origin', origin], '', 'Problem with setting remote url.');
    }

    addOrigin(origin: string) {

        return this._task(['remote', 'add', 'origin', origin], '', 'Problem with adding remote url.');
    }

    init() {

        return this._task(['init'], 'Successfully initialized empty repository', 'Problem with initializing empty repository.');
    }

    private _spawn(args: string[], showOutput: boolean = false, cwd: string = this.cwd): ChildProcess {

        return childProcess.spawn(this.cmd, args, {
            cwd,
            ...this.isWindows && { shell: true },
            ...showOutput && { stdio: 'inherit' }
        });
    }

    private _task(args: string[], successMsg: string, errorMsg: string, cwd: string = this.cwd): Promise<string> {

        return new Promise((resolve, reject) => {
            const task = this._spawn(args, true, cwd);
            task.on('error', error => reject(error));
            task.on('exit', code => code === CliStatus.SUCCESS ? resolve(successMsg) : reject(errorMsg));
        });
    }
}

export default GitManager;
