'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sandbox = require('sinon').createSandbox();
const { assert, expect } = require('chai');
const fs = require('fs');

describe('Command: Help', () => {

    let command;
    let HelpCommand;
    let authHandler;
    let consoleTableStub;

    beforeEach(() => {

        HelpCommand = require('../../commands/help-command.js');
        authHandler = new AuthHandler(false);
        command = new HelpCommand(authHandler);
        consoleTableStub = sandbox.stub(console, 'table');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        command = new HelpCommand();

        expect(command).to.have.property('authHandler');
    });

    it('should have assigned handler', () => {

        command.execute();

        expect(command).to.have.property('handler');
    });

    it('should include all comands definitions', () => {

        command.execute();

        expect(command.result).to.deep.include.all.members([
            { Command: 'help', Description: 'show this info' },
            { Command: 'list', Description: 'list available packages' },
            { Command: 'orders', Description: 'list all your orders' },
            { Command: 'init', Description: 'initialize chosen package' },
            { Command: 'publish', Description: 'publish your project' },
            { Command: 'set-name', Description: 'change your project name' }
        ]);
    });

    it('should include login command if user is not logged in', () => {

        sandbox.stub(fs, 'existsSync').returns(false);
        sandbox.stub(fs, 'readFileSync').returns('fakeToken');
        sandbox.stub(process, 'exit');
        authHandler = new AuthHandler(true);
        authHandler.isAuth = false;
        command = new HelpCommand(authHandler);

        command.execute();

        expect(command.result).to.deep.include({ Command: 'login', Description: 'log in to your MDB account' });
    });

    it('should include logout command if user is logged in', () => {

        authHandler = new AuthHandler(false);
        authHandler.isAuth = true;
        command = new HelpCommand(authHandler);

        command.execute();

        expect(command.result).to.deep.include({ 'Command': 'logout', 'Description': 'logout from cli' });
    });

    it('should print all availiable commands', () => {

        const printSpy = sandbox.spy(command, 'print');

        command.execute();

        assert.isTrue(consoleTableStub.calledImmediatelyAfter(printSpy), 'print not called');
        expect(consoleTableStub.calledOnce).to.equal(true);
    });
});
