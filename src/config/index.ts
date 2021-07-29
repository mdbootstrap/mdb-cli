'use strict';

import { config } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';

config({ path: join(__dirname, '..', '.env') });

const env = process.env.NODE_ENV || 'prd';
const gitlabUrl = process.env.GITLAB_URL || 'https://git.mdbgo.com';
const projectsDomain = process.env.PROJECTS_DOMAIN || 'mdbgo.io';
const technologies = process.env.BACKEND_TECHNOLOGIES || 'node8,node10,node12,php7.2,php7.3,php7.4,php-laravel';
const databases = process.env.DATABASES || 'mysql8,mongodb';
const mdbgoPipelinePublicBranch = process.env.MDBGO_PIPELINE_PUBLIC_BRANCH || 'mdbgo/public';
const memberRoles = process.env.MEMBER_ROLES || 'owner,developer,reporter';

process.env['NODE_NO_WARNINGS'] = '1';

export default {
    env,
    gitlabUrl,
    mdbgoPipelinePublicBranch,
    projectsDomain,
    databases: databases.split(','),
    backendTechnologies: technologies.split(','),
    memberRoles: memberRoles.split(','),
    tokenFile: '.auth',
    tokenDir: join(homedir(), '.mdbcli'),
    port: process.env.PORT || 3033,
    host: process.env.HOST || 'apps.mdbootstrap.com',
    apiPath: process.env.API_PATH || '/api',
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
