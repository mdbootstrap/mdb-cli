'use strict';

const ProjectsHandler = require('../utils/projects-handler');
const Command = require('./command');
const AuthHandler = require('../utils/auth-handler');

class ProjectsCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new ProjectsHandler(authHandler);

        this.setAuthHeader();
    }

    execute() {

        return this.handler.fetchProjects()
            .then(() => {

                this.result = this.handler.getResult();

                this.print();
            })
            .catch(console.error);
    }
}

module.exports = ProjectsCommand;