'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {

    async createJenkinsfile(cwd) {

        const arvJenkinsfile =
`pipeline {
    agent {
        docker {
            image 'node:10'
            args '-u root:root'
            reuseNode true
        }
    }
    stages {
        stage('Tests') {
            steps {
                sh 'npm i'
                sh 'npm test'
            }
        }
    }
}`;

        const jqJenkinsfile =
`pipeline {
    agent any
    stages {
        stage('No-op') {
            steps {
                echo 'Doing nothing..'
            }
        }
    }
}`;

        const jenkinsfilePath = path.join(cwd, 'Jenkinsfile');

        if (fs.existsSync(jenkinsfilePath)) {

            return false;
        }

        const helpers = require('../helpers');
        const packageJsonPath = path.join(cwd, 'package.json');
        const packageJson = await helpers.deserializeJsonFile(packageJsonPath);

        if (packageJson.dependencies && packageJson.scripts && packageJson.scripts.test) {

            fs.writeFileSync(jenkinsfilePath, arvJenkinsfile, 'utf8');

        } else {

            fs.writeFileSync(jenkinsfilePath, jqJenkinsfile, 'utf8');
        }

        return true;
    }
};
