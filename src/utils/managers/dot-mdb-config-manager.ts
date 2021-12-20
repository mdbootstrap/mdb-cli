import fs from 'fs';
import path from 'path';
import config from '../../config';
import { ProjectEntry } from '../../models';

import { DOT_MDB_SCHEME, DotMdb, DotMdbGlobal, DOT_MDB_GLOBAL_SCHEME } from "../../models/dot-mdb";

class DotMdbConfigManager {

    public mdbConfig: DotMdb = {};
    public globalConfig: DotMdbGlobal = {};

    constructor() {
        this.load();
    }

    getValue(keyPath: string, global: boolean = false): string | undefined {

        this.validateConfigKey(keyPath);

        const pathSplit = keyPath.split('.');
        let temp: DotMdb | DotMdbGlobal = { ...(global ? this.globalConfig : this.mdbConfig) };
        for (let part of pathSplit) {
            if (!temp.hasOwnProperty(part)) {
                return undefined;
            }
            // @ts-ignore
            temp = temp[part];
        }

        return temp as string;
    }

    setValue(keyPath: string, value: string | ProjectEntry[], global: boolean = false) {

        this.validateConfigKey(keyPath, global);

        this._setKeyPathValue(global ? this.globalConfig : this.mdbConfig, keyPath, value);
    }

    unsetValue(keyPath: string, global: boolean = false) {

        this.validateConfigKey(keyPath, global);

        this._unsetKeyPathValue(global ? this.globalConfig : this.mdbConfig, keyPath);
    }

    validateConfigKey(keyPath: string, global: boolean = false) {

        const pathSplit = keyPath.split('.');
        let temp = global ? DOT_MDB_GLOBAL_SCHEME : DOT_MDB_SCHEME;
        pathSplit.forEach((part) => {
            if (!temp.hasOwnProperty(part)) {
                throw new Error(`Invalid config: ${keyPath}`);
            }
            // @ts-ignore
            temp = temp[part];
        });
    }

    save(cwd = process.cwd(), global: boolean = false) {
        const settingsPath = path.join(global ? config.tokenDir : cwd, '.mdb');
        const settings = global ? this.globalConfig : this.mdbConfig;

        try {
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
        } catch (e) {
            throw new Error(`Could not save config file: ${e}`);
        }
    }

    load() {
        const settingsPath = path.join(process.cwd(), '.mdb');
        const globalSettingsPath = path.join(config.tokenDir, '.mdb');

        try {
            const config = fs.readFileSync(settingsPath, 'utf8');
            this.mdbConfig = JSON.parse(config);
        } catch (e) {
            this.mdbConfig = {};
        }

        try {
            const globalConfig = fs.readFileSync(globalSettingsPath, 'utf8');
            this.globalConfig = JSON.parse(globalConfig);
        } catch (e) {
            this.globalConfig = {};
        }
    }

    private _unsetKeyPathValue(object: DotMdb | DotMdbGlobal, keyPath: string) {
        const pathSplit = keyPath.split('.');
        if (pathSplit.length === 1) {
            if (object.hasOwnProperty(keyPath)) {
                // @ts-ignore
                delete object[keyPath];
            }
            return;
        }
        // @ts-ignore
        this._unsetKeyPathValue(object[pathSplit[0]] || {}, pathSplit.slice(1).join('.'));
    }

    private _setKeyPathValue(object: DotMdb | DotMdbGlobal, keyPath: string, value: string | ProjectEntry[]) {
        const pathSplit = keyPath.split('.');
        if (pathSplit.length === 1) {
            // @ts-ignore
            return object[keyPath] = value;
        } else {
            // @ts-ignore
            object[pathSplit[0]] = object[pathSplit[0]] || {};
        }
        // @ts-ignore
        this._setKeyPathValue(object[pathSplit[0]], pathSplit.slice(1).join('.'), value);
    }
}

export default DotMdbConfigManager;
