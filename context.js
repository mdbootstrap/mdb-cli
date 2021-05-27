'use strict';

const fs = require('fs');
const path = require('path');
const PackageManager = require('./utils/managers/package-manager');
const PackageManagers = require('./models/package-managers');
const DotMdbConfigManager = require('./utils/managers/dot-mdb-config-manager');

const config = require('./config');

class Context {

    constructor(entity, command, args, flags) {
        this.userToken = '';
        this.mdbConfig = new DotMdbConfigManager();
        this.packageJsonConfig = {};
        this.packageManager = null;

        this._entity = entity;
        this._command = command;
        this._args = args;
        this._flags = flags;

        this._nonArgFlags = new Set([
            'all', 'force', 'help'
        ]);

        this._flagExpansions = new Map([
            ['-h', '--help'],
            ['-a', '--all'],
            ['-f', '--force']
        ]);

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

    getParsedFlags() {
        const flags = this.rawFlags.slice();
        const parsedFlags = {};

        while (flags.length) {
            let f = this._consumeNextFlag(flags);

            if (!this._isFlag(f)) {
                throw new Error(`Unknown flag: ${f}`);
            }

            if (!this._isExpanded(f) && !this._isFlagExpansion(f)) {
                throw new Error(`Unknown flag: ${f}`);
            } else if (this._isFlagExpansion(f)) {
                f = this._flagExpansions.get(f);
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

    registerNonArgFlags(nonArgFlags = []) {
        if (nonArgFlags.length === 0) {
            throw new Error('No non-arg flags to register!');
        }

        nonArgFlags.forEach((naf) => this._nonArgFlags.add(naf));
    }

    registerFlagExpansions(flagExpansions = {}) {
        if (Object.keys(flagExpansions).length === 0) {
            throw new Error('No flag expansions to register!');
        }

        Object.entries(flagExpansions).forEach(([flag, expansion]) => this._flagExpansions.set(flag, expansion));
    }

    _consumeNextFlag(flags) {
        return flags.shift();
    }

    _isFlagExpansion(flag) {
        return this._flagExpansions.has(flag);
    }

    _isNonArgFlag(flag) {
        return this._nonArgFlags.has(flag);
    }

    _isExpanded(flag) {
        return flag.startsWith('--');
    }

    _isFlag(flag) {
        return flag.startsWith('-');
    }

    async loadPackageManager() {
        if (this.packageManager === null) {
            const manager = this.mdbConfig.getValue('packageManager');
            this.packageManager = await PackageManager.load(manager);

            const selectedManager = this.packageManager.cmdCommand;
            this.mdbConfig.setValue('packageManager', selectedManager);
        }
    }

    authenticateUser() {
        try {
            this.userToken = fs.readFileSync(path.join(config.tokenDir, config.tokenFile), 'utf8');
        } catch (e) {
            throw new Error('Please login first');
        }
    }

    setPackageJsonValue(key, value, cwd = process.cwd()) {
        const settingsPath = path.join(cwd, 'package.json');
        this.packageJsonConfig[key] = value;

        try {
            fs.writeFileSync(settingsPath, JSON.stringify(this.packageJsonConfig, null, 2), 'utf8');
        } catch (e) {
            throw new Error(`Could not save package.json key '${key}': ${e.message}`);
        }
    }

    _loadPackageJsonConfig(cwd = process.cwd()) {
        const settingsPath = path.join(cwd, 'package.json');

        try {
            const config = fs.readFileSync(settingsPath, 'utf8');
            this.packageJsonConfig = JSON.parse(config);
        } catch (e) {
            this.packageJsonConfig = {};
        }
    }
}

module.exports = Context;
