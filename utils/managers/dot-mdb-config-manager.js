'use strict';

const fs = require('fs');
const path = require('path');
const DOT_MDB_SCHEME = require('../../models/dot-mdb');

class DotMdbConfigManager {

    constructor() {
        this.mdbConfig = {};

        this._load();
    }

    getValue(keyPath) {

        this.validateConfigKey(keyPath);

        const pathSplit = keyPath.split('.');
        let temp = { ...this.mdbConfig };
        for (let part of pathSplit) {
            if (!temp.hasOwnProperty(part)) {
                return undefined;
            }
            temp = temp[part];
        }

        return temp;
    }

    setValue(keyPath, value) {

        this.validateConfigKey(keyPath);

        this._setKeyPathValue(this.mdbConfig, keyPath, value);
    }

    unsetValue(keyPath) {

        this.validateConfigKey(keyPath);

        this._unsetKeyPathValue(this.mdbConfig, keyPath);
    }

    validateConfigKey(keyPath) {

        const pathSplit = keyPath.split('.');
        let temp = DOT_MDB_SCHEME;
        pathSplit.forEach((part) => {
            if (!temp.hasOwnProperty(part)) {
                throw new Error(`Invalid config: ${keyPath}`);
            }
            temp = temp[part];
        });
    }

    save(cwd = process.cwd()) {
        const settingsPath = path.join(cwd, '.mdb');

        try {
            fs.writeFileSync(settingsPath, JSON.stringify(this.mdbConfig, null, 2), 'utf8');
        } catch (e) {
            throw new Error(`Could not save config file: ${e}`);
        }
    }

    _load(cwd = process.cwd()) {
        const settingsPath = path.join(cwd, '.mdb');

        try {
            const config = fs.readFileSync(settingsPath, 'utf8');
            this.mdbConfig = JSON.parse(config);
        } catch (e) {
            this.mdbConfig = {};
        }
    }

    _unsetKeyPathValue(object, keyPath) {
        const pathSplit = keyPath.split('.');
        if (pathSplit.length === 1) {
            if (object.hasOwnProperty(keyPath)) {
                delete object[keyPath];
            }
            return;
        }
        this._unsetKeyPathValue(object[pathSplit[0]] || {}, pathSplit.slice(1).join('.'));
    }

    _setKeyPathValue(object, keyPath, value) {
        const pathSplit = keyPath.split('.');
        if (pathSplit.length === 1) {
            return object[keyPath] = value;
        } else {
            object[pathSplit[0]] = object[pathSplit[0]] || {};
        }
        this._setKeyPathValue(object[pathSplit[0]], pathSplit.slice(1).join('.'), value);
    }
}

module.exports = DotMdbConfigManager;
