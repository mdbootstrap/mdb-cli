'use strict';

const { getPackageName } = require('../../helpers/get-project-name');

describe('Helper: get project name', () => {

    it('should return jquery package name', () => {

        expect(getPackageName('jquery')).to.be.equal('MDB-Pro');
    });

    it('should return angular package name', () => {

        expect(getPackageName('angular')).to.be.equal('ng-uikit-pro-standard');
    });

    it('should return react package name', () => {

        expect(getPackageName('react')).to.be.equal('MDB-React-Pro-npm');
    });

    it('should return vue package name', () => {

        expect(getPackageName('vue')).to.be.equal('MDB-Vue-Pro');
    });

    it('should return undefined', () => {

        expect(getPackageName()).to.be.undefined;
    });
});
