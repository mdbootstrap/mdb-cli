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

        this.handler.setArgs(this.args);
        return this.handler.fetchProjects()
            .then(() => this.print())
            .catch(e => this.catchError(e));
    }
}

module.exports = ProjectsCommand;