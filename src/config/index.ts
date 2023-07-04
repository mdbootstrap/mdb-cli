'use strict';

import { config } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';

config({ path: join(__dirname, '..', '.env') });

const env = process.env.NODE_ENV || 'prd';
const gitlabUrl = process.env.GITLAB_URL || 'https://git.mdbgo.com';
const projectsDomain = process.env.PROJECTS_DOMAIN || 'mdbgo.io';
const technologies = process.env.BACKEND_TECHNOLOGIES || 'node8,node10,node12,node14,node16,node17,php7.2,php7.3,php7.4,php-laravel,python3.10';
const databases = process.env.DATABASES || 'mysql8,mongodb';
const mdbgoPipelinePublicBranch = process.env.MDBGO_PIPELINE_PUBLIC_BRANCH || 'mdbgo/public';
const memberRoles = process.env.MEMBER_ROLES || 'owner,developer,reporter';
const host = process.env.HOST || 'apps.mdbootstrap.com';
const port = process.env.PORT;
const apiPath = typeof process.env.API_PATH === "undefined" ? '/api' : process.env.API_PATH;

process.env['NODE_NO_WARNINGS'] = '1';

export default {
    env,
    gitlabUrl,
    mdbgoPipelinePublicBranch,
    projectsDomain,
    databases: databases.split(','),
    memberRoles: memberRoles.split(','),
    tokenFile: '.auth',
    tokenDir: join(homedir(), '.mdbcli'),
    msgPath: join(homedir(), '.mdbcli', '.msg'),
    port,
    host,
    apiPath,
    apiUrl: env === 'dev' ? process.env.API_URL : `https://${host}${apiPath}`,
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
    },
    backend: {
        technologies: technologies.split(','),
        requiredFiles: [
            { tech: 'node', name: 'package.json' },
            { tech: 'laravel', name: 'composer.json' },
            { tech: 'python', name: 'requirements.txt' }
        ]
    },
    projectTypes: ['frontend', 'backend', 'wordpress']
};
