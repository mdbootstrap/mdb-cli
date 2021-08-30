'use strict';

import config from '../config';
import Context from '../context';
import Receiver from './receiver';
import { OutputColor, StarterOption } from '../models';


class StarterReceiver extends Receiver {

    private loggedin = false;

    constructor(context: Context) {
        super(context);

        this.context.authenticateUser(false);
        this.loggedin = !!this.context.userToken;

        this.options = {
            hostname: config.host,
            ...this.loggedin && { headers: { Authorization: `Bearer ${this.context.userToken}` } }
        };

        this.context.registerFlagExpansions({
            '-o': '--only'
        });

        this.flags = this.context.getParsedFlags();
    }

    async list(): Promise<void> {

        if (!this.loggedin)
            this.result.liveAlert(OutputColor.Yellow, '\nWarning!', 'You are not logged in, it will show only free starters as available.');

        this.result.liveTextLine('\nFetching starters...');

        try {
            this._validateOnlyFlag();

            const queryParamType = this.flags.only ? `type=${this.flags.only}` : '';
            const queryParamAvailable = !this.flags.all ? 'available=true' : '';
            const freeStarters = this.loggedin ? '' : '/free';

            this.options.path = `/packages/starters${freeStarters}?${queryParamType}&${queryParamAvailable}`;
            const { body: response } = await this.http.get(this.options);
            const starters = JSON.parse(response);

            const available = [], unavailable = [];
            for (let i = 0; i < starters.length; i++) {
                if (starters[i].available) available.push(starters[i]);
                else unavailable.push(starters[i]);
            }

            this._printStartersMap(OutputColor.Green, 'Available starters:', this._buildStartersMap(available));
            if (this.flags.all) {
                this._printStartersMap(OutputColor.Red, 'Unavailable starters:', this._buildStartersMap(unavailable));
            }
        } catch (e) {
            return this.result.addAlert(OutputColor.Red, 'Error', `Could not fetch starters: ${e.message}`);
        }
    }

    private _validateOnlyFlag(): void {
        if (!!this.flags.only && !['frontend', 'backend', 'wordpress'].includes(this.flags.only as string)) {
            throw new Error('Invalid value for --only flag');
        }
    }

    private _buildStartersMap(options: StarterOption[]) {
        return options.reduce<{ [key: string]: { name: string, short: string, value: string }[] }>((res, curr) => {
            res[`${curr.category} ${curr.license}`] = res[`${curr.category} ${curr.license}`] || [];

            res[`${curr.category} ${curr.license}`].push({
                name: curr.displayName,
                short: curr.code,
                value: curr.code
            });

            return res;
        }, {});
    }

    private _printStartersMap(color: OutputColor, header: string, map: any): void {

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

    async init(): Promise<void> {
        // TODO: implement
        this.result.addTextLine('This command is not implemented yet. In order to initialize a project you need to provide an entity, e.x: mdb frontend init');
    }
}

export default StarterReceiver;