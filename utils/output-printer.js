'use strict';

class OutputPrinter {

    constructor() {

        this.consoleColors = {
            red: '\x1b[31m%s\x1b[0m',
            green: '\x1b[32m%s\x1b[0m',
            yellow: '\x1b[33m%s\x1b[0m',
            blue: '\x1b[34m%s\x1b[0m',
            purple: '\x1b[35m%s\x1b[0m',
            turquoise: '\x1b[36m%s\x1b[0m',
            grey: '\x1b[37m%s\x1b[0m',
            inverted: '\x1b[40m%s\x1b[0m',
            invertedRed: '\x1b[41m%s\x1b[0m',
            invertedGreen: '\x1b[42m%s\x1b[0m',
            invertedYellow: '\x1b[43m%s\x1b[0m',
            invertedBlue: '\x1b[44m%s\x1b[0m',
            invertedPurple: '\x1b[45m%s\x1b[0m',
            invertedTurquoise: '\x1b[46m%s\x1b[0m',
            invertedGrey: '\x1b[47m%s\x1b[0m'
        };
    }

    /**
     * @param results: CommandResult[]
     */
    print(results) {

        results.forEach((cr) => {

            cr.messages.forEach((m) => {

                if (m.type === 'text') {
                    console.log(m.value);
                } else if (m.type === 'table') {
                    console.table(m.value);
                } else if (m.type === 'alert') {
                    console.log(this.consoleColors[m.color], m.value.title, m.value.body);
                } else {
                    console.log(m.value);
                }
            });
        });
    }
}

module.exports = OutputPrinter;
