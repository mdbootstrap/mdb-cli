'use strict';

module.exports = {

    getThemeName(pageType) {

        switch (pageType) {
            case 'blog':
                return 'mdb-blog-wordpress-theme';
            case 'ecommerce':
                return 'mdb-ecommerce-wordpress-theme';
            case 'blog+ecommerce':
                return 'mdb-blog-with-ecommerce-wordpress-theme';
            case 'sample':
                return 'mdb-sample-wp-theme';
            default:
                return '';
        }
    }
}
