'use strict';

module.exports = {

    parseArgs(args, initArgsMap) {

        let result = {};

        for (let i = 0; i <= args.length - 2; i += 2) {

            if (initArgsMap.hasOwnProperty(args[i])) {

                result[args[i]] = args[i + 1];
            }
        }

        return result;
    }
};
