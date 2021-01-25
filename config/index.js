'use strict';

const path = require('path');
const homedir = require('os').homedir();
const env = process.env.NODE_ENV || 'prd';
const gitlabUrl = process.env.GITLAB_URL || 'https://git.mdbgo.com';
const projectsDomain = process.env.PROJECTS_DOMAIN || 'mdbgo.io';
const technologies = process.env.BACKEND_TECHNOLOGIES || 'node8,node10,node12,php7.2,php7.3,php7.4,php-laravel';
const databases = process.env.DATABASES || 'mysql8,mongodb';
const wpPageVariants = process.env.WP_PAGE_VARIANTS || 'blog,ecommerce,blog+ecommerce,sample';
const mdbgoPipelinePublicBranch = process.env.MDBGO_PIPELINE_PUBLIC_BRANCH || 'mdbgo/public';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
process.env['NODE_NO_WARNINGS'] = 1;
module.exports = {
    env,
    gitlabUrl,
    mdbgoPipelinePublicBranch,
    projectsDomain,
    wpPageVariants: wpPageVariants.split(','),
    databases: databases.split(','),
    backendTechnologies: technologies.split(','),
    tokenFile: '.auth',
    tokenDir: path.join(homedir, '.mdbcli'),
    port: process.env.PORT || 3033,
    host: process.env.HOST || 'apps.mdbootstrap.com',
    auth: {
        social: {
            google: {
                url: process.env.AUTH_SOCIAL_GOOGLE_URL
            },
            facebook: {
                url: process.env.AUTH_SOCIAL_FACEBOOK_URL
            },
            twitter: {
                url: process.env.AUTH_SOCIAL_TWITTER_URL
            }
        }
    }
};
