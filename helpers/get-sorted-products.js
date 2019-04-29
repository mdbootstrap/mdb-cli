'use strict';

module.exports = (array, key) => array.slice().sort((a, b) => {

    const aTech = a[key].substr(a[key].indexOf('('), a[key].indexOf(')'));
    const bTech = b[key].substr(b[key].indexOf('('), b[key].indexOf(')'));

    if (aTech > bTech) {

        return 1;
    } else if (aTech < bTech) {

        return -1;
    }

    return 0;
});
