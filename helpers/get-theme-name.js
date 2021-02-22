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
            case 'starter':
                return 'mdb-sample-wp-theme';
            case 'starter-free':
                return 'mdb-sample-free-wp-theme';
            case 'empty-starter':
                return 'mdb-empty-wp-theme';
            default:
                return '';
        }
    }
};
