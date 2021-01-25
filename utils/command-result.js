'use strict';

const EventEmitter = require('events');

class CommandResult extends EventEmitter {

    constructor(...args) {
        super(...args);

        this._messages = [];
    }

    get messages() {
        return this._messages;
    }

    addTextLine(msg) {
        this._messages.push({ type: 'text', value: msg });
    }

    addTable(table) {
        this._messages.push({ type: 'table', value: table });
    }

    addAlert(color, title, body) {
        this._messages.push({ type: 'alert', value: { title, body }, color });
    }

    liveTextLine(msg) {
        this._liveOutput({ type: 'text', value: msg });
    }

    liveTable(table) {
        this._liveOutput({ type: 'table', value: table });
    }

    liveAlert(color, title, body) {
        this._liveOutput({ type: 'alert', value: { title, body }, color });
    }

    _liveOutput(msg) {
        this.emit('mdb.cli.live.output', { messages: [msg] });
    }
}

module.exports = CommandResult;
