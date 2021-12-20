'use strict';

export function getThemeName(pageType: string): string {

    switch (pageType) {
        case 'wp-essential-blog':
            return 'mdb-blog-wordpress-theme';
        case 'wp-essential-ecommerce':
            return 'mdb-ecommerce-wordpress-theme';
        case 'wp-essential-blog-ecomm':
            return 'mdb-blog-with-ecommerce-wordpress-theme';
        case 'wp-essential-starter':
            return 'mdb-sample-wp-theme';
        case 'wp-free-starter':
            return 'mdb-sample-free-wp-theme';
        case 'wp-free-empty-starter':
            return 'mdb-empty-wp-theme';
        default:
            return '';
    }
}
