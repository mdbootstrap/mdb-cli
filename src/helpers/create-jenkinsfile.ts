'use strict';

import fs from 'fs';
import path from 'path';

async function createJenkinsfile(cwd: string, simple: boolean): Promise<boolean> {

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
                echo 'Doing nothing...'
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

export default createJenkinsfile;
