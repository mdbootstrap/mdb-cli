import {OutputColor} from "./output-color";

export type MessageType = 'text' | 'table' | 'alert';
export type TextLineMessage = { type: MessageType, value: string };
export type TableMessage = { type: MessageType, value: object[] };
export type AlertMessage = { type: MessageType, value: { title: string, body: string }, color: OutputColor };
