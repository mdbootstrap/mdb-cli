'use strict';

import EventEmitter from "events";
import {OutputColor} from "../models/output-color";
import {AlertMessage, MessageType, TableMessage, TextLineMessage} from "../models/output-message";

class CommandResult extends EventEmitter {

    private _messages: Array<TextLineMessage | TableMessage | AlertMessage> = [];

    constructor(...args: any[]) {
        super(...args);
    }

    get messages() {
        return this._messages;
    }

    addTextLine(msg: TextLineMessage['value']) {
        this._messages.push({ type: 'text', value: msg });
    }

    addTable(table: TableMessage['value']) {
        this._messages.push({ type: 'table', value: table });
    }

    addAlert(color: OutputColor, title: AlertMessage['value']['title'], body: AlertMessage['value']['body']) {
        this._messages.push({ type: 'alert', value: { title, body }, color });
    }

    liveTextLine(msg: TextLineMessage['value']) {
        this._liveOutput({ type: 'text', value: msg });
    }

    liveTable(table: TableMessage['value']) {
        this._liveOutput({ type: 'table', value: table });
    }

    liveAlert(color: OutputColor, title: AlertMessage['value']['title'], body: AlertMessage['value']['body']) {
        this._liveOutput({ type: 'alert', value: { title, body }, color });
    }

    private _liveOutput(msg: { type: MessageType, value: TextLineMessage['value'] | TableMessage['value'] | AlertMessage['value'], color?: OutputColor }) {
        this.emit('mdb.cli.live.output', { messages: [msg] });
    }
}

export default CommandResult;
