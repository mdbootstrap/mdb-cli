'use strict';

const AuthHandler = require('../../utils/auth-handler');
const { assert, expect } = require('chai');
const sinon = require('sinon');

describe('Command: Help', () => {

    let command;
    let HelpCommand;
    let authHandler;

    beforeEach(() => {

        HelpCommand = require('../../commands/help-command.js');
        authHandler = new AuthHandler(false);
        command = new HelpCommand(authHandler);
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

        const printSpy = sinon.spy(command, 'print');
        const consoleSpy = sinon.spy(console, 'table');

        command.execute();

        assert.isTrue(consoleSpy.calledImmediatelyAfter(printSpy), 'print not called'); 
        expect(consoleSpy.calledOnce).to.equal(true);      

        printSpy.restore();
        consoleSpy.restore();
    });
});