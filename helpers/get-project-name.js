'use strict';

module.exports = (technology) => {

    switch (technology) {
        case 'jquery':
            return 'MDB-Pro';
        case 'angular':
            return 'ng-uikit-pro-standard';
        case 'react':
            return 'MDB-React-Pro-npm';
        case 'vue':
            return 'MDB-Vue-Pro';
    }
};

