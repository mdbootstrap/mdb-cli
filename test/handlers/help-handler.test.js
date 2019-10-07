'use strict';

const HelpHandler = require('../../utils/help-handler');
const AuthHandler = require('../../utils/auth-handler');

describe('Handler: Help', () => {

    it('should have assign authHandler', () => {

        const helpHandler = new HelpHandler();
        
        expect(helpHandler.authHandler).to.be.an.instanceOf(AuthHandler);
    });
});
