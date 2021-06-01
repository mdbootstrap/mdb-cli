'use strict';

import fs from "fs";
import path from "path";
import config from "./config";
import {MdbGoPackageJson} from "./models/package-json";
import {PackageManagers} from "./models/package-managers";
import PackageManager from "./utils/managers/package-manager";
import PackageManagerLoader from "./utils/managers/package-manager-loader";
import DotMdbConfigManager from "./utils/managers/dot-mdb-config-manager";

class Context {

    public userToken = '';
    public mdbConfig = new DotMdbConfigManager();
    public packageJsonConfig: MdbGoPackageJson = {};
    public packageManager: PackageManager | null = null;

    private _entity: string;
    private readonly _command: string;
    private readonly _args: string[];
    private readonly _flags: string[];

    private _nonArgFlags = new Set([
        'all', 'force', 'help'
    ]);

    private _flagExpansions = new Map([
        ['-h', '--help'],
        ['-a', '--all'],
        ['-f', '--force']
    ]);

    constructor(entity: string, command: string, args: string[], flags: string[]) {

        this._entity = entity;
        this._command = command;
        this._args = args;
        this._flags = flags;

        this._loadPackageJsonConfig();
    }

    get entity() {
        return this._entity;
    }

    get command() {
        return this._command;
    }

    get args() {
        return this._args;
    }

    get rawFlags() {
        return this._flags;
    }

    set entity(entity) {
        this._entity = entity;
    }

    getParsedFlags(): { [key: string]: string | boolean } {
        const flags = this.rawFlags.slice();
        const parsedFlags: { [key: string]: string | boolean } = {};

        while (flags.length) {
            let f = this._consumeNextFlag(flags);

            if (!this._isFlag(f)) {
                throw new Error(`Unknown flag: ${f}`);
            }

            if (!this._isExpanded(f) && !this._isFlagExpansion(f)) {
                throw new Error(`Unknown flag: ${f}`);
            } else if (this._isFlagExpansion(f)) {
                f = this._flagExpansions.get(f) as string;
            }

            f = f.slice(2);

            if (this._isNonArgFlag(f)) {
               parsedFlags[f] = true;
            } else {
                parsedFlags[f] = this._consumeNextFlag(flags);
            }
        }

        return parsedFlags;
    }

    registerNonArgFlags(nonArgFlags: string[] = []): void {
        if (nonArgFlags.length === 0) {
            throw new Error('No non-arg flags to register!');
        }

        nonArgFlags.forEach((naf) => this._nonArgFlags.add(naf));
    }

    registerFlagExpansions(flagExpansions: { [key: string]: string } = {}): void {
        if (Object.keys(flagExpansions).length === 0) {
            throw new Error('No flag expansions to register!');
        }

        Object.entries(flagExpansions).forEach(([flag, expansion]) => this._flagExpansions.set(flag, expansion));
    }

    private _consumeNextFlag(flags: string[]): string {
        return flags.shift() as string;
    }

    private _isFlagExpansion(flag: string): boolean {
        return this._flagExpansions.has(flag);
    }

    private _isNonArgFlag(flag: string): boolean {
        return this._nonArgFlags.has(flag);
    }

    private _isExpanded(flag: string): boolean {
        return flag.startsWith('--');
    }

    private _isFlag(flag: string): boolean {
        return flag.startsWith('-');
    }

    async loadPackageManager(): Promise<void> {
        if (this.packageManager === null) {
            const manager = this.mdbConfig.getValue('packageManager') || this.mdbConfig.getValue('packageManager', true);
            this.packageManager = await PackageManagerLoader.load(PackageManagers[manager?.toUpperCase() as keyof typeof PackageManagers]);

            const selectedManager = this.packageManager.cmdCommand;
            this.mdbConfig.setValue('packageManager', selectedManager);
        }
    }

    authenticateUser(): void {
        try {
            this.userToken = fs.readFileSync(path.join(config.tokenDir, config.tokenFile), 'utf8');
        } catch (e) {
            throw new Error('Please login first');
        }
    }
    setPackageJsonValue(key: keyof MdbGoPackageJson, value: string, cwd = process.cwd()) {
        const settingsPath = path.join(cwd, 'package.json');
        // @ts-ignore
        this.packageJsonConfig[key] = value;

        try {
            fs.writeFileSync(settingsPath, JSON.stringify(this.packageJsonConfig, null, 2), 'utf8');
        } catch (e) {
            throw new Error(`Could not save package.json key '${key}': ${e.message}`);
        }
    }

    _loadPackageJsonConfig(cwd = process.cwd()): void {
        const settingsPath = path.join(cwd, 'package.json');

        try {
            const config = fs.readFileSync(settingsPath, 'utf8');
            this.packageJsonConfig = JSON.parse(config);
        } catch (e) {
            this.packageJsonConfig = {};
        }
    }
}

export default Context;
