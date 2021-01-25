'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {

    async createJenkinsfile(cwd, simple) {

        const simpleJenkinsfile =
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

        const noopJenkinsfile =
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

        fs.writeFileSync(jenkinsfilePath, simple ? simpleJenkinsfile : noopJenkinsfile, 'utf8');

        return true;
    }
};
