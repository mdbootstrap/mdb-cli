'use strict';

const Receiver = require('./receiver');
const config = require('../config');

class StarterReceiver extends Receiver {

    constructor(context) {
        super(context);

        this.context.authenticateUser();

        this.options = {
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };

        this.context.registerFlagExpansions({
            '-o': '--only'
        });

        this.flags = this.context.getParsedFlags();
    }

    async list() {

        this.result.liveTextLine('Fetching starters...');

        try {
            this._validateOnlyFlag();

            const queryParamType = this.flags.only ? `type=${this.flags.only}` : '';
            const queryParamAvailable = !this.flags.all ? 'available=true' : '';

            this.options.path = `/packages/starters?${queryParamType}&${queryParamAvailable}`;
            const { body: response } = await this.http.get(this.options);
            const starters = JSON.parse(response);

            const available = [], unavailable = [];
            for (let i = 0; i < starters.length; i++) {
                if (starters[i].available) available.push(starters[i]);
                else unavailable.push(starters[i]);
            }

            this._printStartersMap('green', 'Available starters:', this._buildStartersMap(available));
            if (this.flags.all) {
                this._printStartersMap('red', 'Unavailable starters:', this._buildStartersMap(unavailable));
            }
        } catch (e) {
            return this.result.addAlert('red', 'Error', `Could not fetch starters: ${e.message}`);
        }
    }

    _validateOnlyFlag() {
        if (!!this.flags.only && !['frontend', 'backend', 'wordpress'].includes(this.flags.only)) {
            throw new Error('Invalid value for --only flag');
        }
    }

    _buildStartersMap(options) {
        return options.reduce((res, curr) => {
            res[`${curr.category} ${curr.license}`] = res[`${curr.category} ${curr.license}`] || [];

            res[`${curr.category} ${curr.license}`].push({
                name: curr.displayName,
                short: curr.code,
                value: curr.code
            });

            return res;
        }, {});
    }

    _printStartersMap(color, header, map) {

        this.result.addTextLine('');
        this.result.addAlert(color, header, '\n');

        for (let key in map) {
            this.result.addTextLine(`---- ${key} ----`);
            for (let starter of map[key]) {
                this.result.addTextLine(starter.name);
            }

            this.result.addTextLine('');
        }
    }

    async init() {
        // TODO: implement
        this.result.addTextLine('This command is not implemented yet. In order to initialize a project you need to provide an entity, e.x: mdb frontend init');
    }
}

module.exports = StarterReceiver;

