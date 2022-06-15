import atob from "atob";
import { join } from "path";
import { readFileSync, unlinkSync, writeFileSync } from "fs";
import config from "./config";
import { ParsedFlags, UserPlanData } from "./models";
import { MdbGoPackageJson } from "./models/package-json";
import { PackageManagers } from "./models/package-managers";
import PackageManager from "./utils/managers/package-manager";
import PackageManagerLoader from "./utils/managers/package-manager-loader";
import DotMdbConfigManager from "./utils/managers/dot-mdb-config-manager";
import HttpWrapper from "./utils/http-wrapper";

class Context {

    public userToken = '';
    public mdbConfig = new DotMdbConfigManager();
    public packageJsonConfig: MdbGoPackageJson = {};
    public packageManager: PackageManager | null = null;
    public serverMessageLast: string = '';
    private http: HttpWrapper;

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

        this.http = new HttpWrapper();
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

    getParsedFlags(): ParsedFlags {
        const flags = this.rawFlags.slice();
        const parsedFlags: ParsedFlags = {};

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
        return flag.startsWith('-') || flag === '.';
    }

    async loadPackageManager(): Promise<void> {
        if (this.packageManager === null) {
            const manager = this.mdbConfig.getValue('packageManager') || this.mdbConfig.getValue('packageManager', true);
            this.packageManager = await PackageManagerLoader.load(PackageManagers[manager?.toUpperCase() as keyof typeof PackageManagers]);

            const selectedManager = this.packageManager.cmdCommand;
            this.mdbConfig.setValue('packageManager', selectedManager);
        }
    }

    authenticateUser(throwError = true): void {

        const { tokenDir, tokenFile } = config;
        const tokenPath = join(tokenDir, tokenFile);

        try {
            this.userToken = readFileSync(tokenPath, 'utf8');
        } catch (e) {
            if (throwError) throw new Error('Please login first');
        }

        if (this._isTokenExpired()) {
            unlinkSync(tokenPath);
            this.userToken = '';
            if (throwError) throw new Error('Please login first');
        }
    }

    _isTokenExpired(): boolean {
        if (!this.userToken) return false;

        try {
            const [, jwtBody] = this.userToken.split('.');
            const { exp } = JSON.parse(atob(jwtBody));
            if (Date.now() >= exp * 1000) return true;
        } catch (e) {
            return true;
        }

        return false;
    }

    async authorizeUser(): Promise<void> {
        const userPlanData = await this._getSubscriptionPlanData();
        const { userPlan, projectsCount } = userPlanData;
        const { countProjectsLimit } = userPlan;

        if (countProjectsLimit !== undefined && countProjectsLimit !== -1 && projectsCount >= countProjectsLimit) {
            throw new Error('You have reached the maximum number of projects allowed for your account. Please upgrade your subscription plan in order to create a new project.');
        }
    }

    async _getSubscriptionPlanData(): Promise<UserPlanData> {
        const options = {
            host: config.host,
            headers: { Authorization: `Bearer ${this.userToken}` },
            path: '/auth/plan'
        }

        const result = await this.http.get(options);
        const { userPlanData } = JSON.parse(result.body);

        return userPlanData;
    }

    setPackageJsonValue(key: keyof MdbGoPackageJson, value: string, cwd = process.cwd()) {
        const settingsPath = join(cwd, 'package.json');
        // @ts-ignore
        this.packageJsonConfig[key] = value;

        try {
            writeFileSync(settingsPath, JSON.stringify(this.packageJsonConfig, null, 2), 'utf8');
        } catch (e: any) {
            throw new Error(`Could not save package.json key '${key}': ${e.message}`);
        }
    }

    _loadPackageJsonConfig(cwd = process.cwd()): void {
        const settingsPath = join(cwd, 'package.json');

        try {
            const config = readFileSync(settingsPath, 'utf8');
            this.packageJsonConfig = JSON.parse(config);
        } catch (e) {
            this.packageJsonConfig = {};
        }
    }

    _addNonArgFlag(flag: string) {
        if (this._isFlag(flag) && this._isNonArgFlag(flag.substring(2))) this._flags.push(flag);
    }
}

export default Context;
