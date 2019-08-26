'use strict';

module.exports = (longName) => {

    switch (longName) {
    case 'jquery': return 'jq';
    case 'angular': return 'ng';
    case 'react': return 're';
    case 'vue': return 'vu';
    }
};
