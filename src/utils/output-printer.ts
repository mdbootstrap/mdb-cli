'use strict';

import { OutputColor } from "../models/output-color";
import CommandResult from "./command-result";
import { AlertMessage, TableMessage, TextLineMessage } from "../models/output-message";

class OutputPrinter {

    private consoleColors = {
        [OutputColor.Red]: '\x1b[31m%s\x1b[0m',
        [OutputColor.Green]: '\x1b[32m%s\x1b[0m',
        [OutputColor.Yellow]: '\x1b[33m%s\x1b[0m',
        [OutputColor.Blue]: '\x1b[34m%s\x1b[0m',
        [OutputColor.Purple]: '\x1b[35m%s\x1b[0m',
        [OutputColor.Turquoise]: '\x1b[36m%s\x1b[0m',
        [OutputColor.Grey]: '\x1b[37m%s\x1b[0m',
        [OutputColor.Inverted]: '\x1b[40m%s\x1b[0m',
        [OutputColor.InvertedRed]: '\x1b[41m%s\x1b[0m',
        [OutputColor.InvertedGreen]: '\x1b[42m%s\x1b[0m',
        [OutputColor.InvertedYellow]: '\x1b[43m%s\x1b[0m',
        [OutputColor.InvertedBlue]: '\x1b[44m%s\x1b[0m',
        [OutputColor.InvertedPurple]: '\x1b[45m%s\x1b[0m',
        [OutputColor.InvertedTurquoise]: '\x1b[46m%s\x1b[0m',
        [OutputColor.InvertedGrey]: '\x1b[47m%s\x1b[0m',
        [OutputColor.GreyBody]: '\x1b[0m%s\x1b[90m%s\x1b[0m'
    };

    /**
     * @param results: CommandResult[]
     */
    print(results: CommandResult[]) {

        results.forEach((cr) => {

            cr.messages.forEach((m: TextLineMessage | TableMessage | AlertMessage) => {

                if (m.type === 'text') {
                    console.log((m as TextLineMessage).value);
                } else if (m.type === 'table') {
                    console.table((m as TableMessage).value);
                } else if (m.type === 'alert') {
                    console.log(this.consoleColors[(m as AlertMessage).color], (m as AlertMessage).value.title, (m as AlertMessage).value.body);
                } else {
                    console.log(m.value);
                }
            });
        });
    }
}

export default OutputPrinter;