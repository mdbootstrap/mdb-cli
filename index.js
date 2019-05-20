#! /usr/bin/env node
'use strict';

require("@babel/polyfill");

if (!process.version.match(/v[1-9][0-9]/)) {
    
    require('console.table');
}

const CommandParser = require('./utils/command-parser');

try {

    CommandParser.parse(process.argv.slice(2));
} catch (e) {

    console.log(e.message);
    CommandParser.parse(['help']);
}
