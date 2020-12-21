'use strict';

const { getThemeName } = require('../../helpers/get-theme-name');

describe('Helper: get theme name', () => {

    it('should return the appropriate theme names', () => {

        expect(getThemeName('blog')).to.be.equal('mdb-blog-wordpress-theme');
        expect(getThemeName('ecommerce')).to.be.equal('mdb-ecommerce-wordpress-theme');
        expect(getThemeName('blog+ecommerce')).to.be.equal('mdb-blog-with-ecommerce-wordpress-theme');
        expect(getThemeName('sample')).to.be.equal('mdb-sample-wp-theme');
        expect(getThemeName('unknown')).to.be.equal('');
    });
});