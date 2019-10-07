'use strict';

const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const helpers = require('../../helpers');
const sandbox = require('sinon').createSandbox();
const chai = require('chai');
const { expect } = require('chai');
const commandClass = require('../../commands/publish-command');

describe('Command: publish', () => {

    let authHandler;
    let command;
    let consTabStub;

    beforeEach(() => {

        authHandler = new AuthHandler(false);
        command = new commandClass(authHandler);
        consTabStub = sandbox.stub(console, 'table');
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have assigned authHandler', () => {

        command = new commandClass();

        expect(command).to.have.property('authHandler');
    });

    it('should have assigned handler', () => {

        expect(command).to.have.property('handler');
    });

    it('should have PublishHandler handler', () => {

        const PublishHandler = require('../../utils/publish-handler');

        expect(command.handler).to.be.an.instanceOf(PublishHandler);
    });

    it('should execute call handler.setProjectName', () => {

        const fakeReturnedPromise = {

            then() {

                return this;
            },
            catch() {

                return this;
            }

        };

        const setProjectNameStub = sandbox.stub(command.handler, 'setProjectName').returns(fakeReturnedPromise);

        chai.assert.isTrue(!setProjectNameStub.called, 'HttpWrapper.setProjectName called');

        command.execute();

        chai.assert.isTrue(setProjectNameStub.calledOnce, 'HttpWrapper.setProjectName not called');
    });

    it('should call buildProject before publish if build script exists', async () => {

        sandbox.stub(helpers, 'deserializeJsonFile').resolves({ scripts: { build: 'build' } });
        const buildStub = sandbox.stub(command.handler, 'buildProject').resolves();
        const publishStub = sandbox.stub(command.handler, 'publish').resolves();

        await command.execute();

        expect(buildStub.calledBefore(publishStub)).to.equal(true);
    });

    it('should add dist folder to project path after buildProject', async () => {

        const fs = require('fs');
        sandbox.stub(fs, 'readFileSync').returns('');
        sandbox.stub(fs, 'writeFileSync').returns();
        sandbox.stub(fs, 'existsSync').returns(true);
        sandbox.stub(fs, 'readdirSync').returns([]);
        sandbox.stub(helpers, 'deserializeJsonFile').resolves({
            scripts: { build: 'build' },
            dependencies: { '@angular/core': '3.4.5' }
        });
        sandbox.stub(helpers, 'buildProject').resolves();
        sandbox.stub(command.handler, 'publish').resolves();

        await command.execute();

        expect(command.handler.cwd.endsWith('dist/angular-bootstrap-md-app')).to.equal(true);
    });

    it('should console.error on handler.setProjectName rejected', async () => {

        sandbox.stub(command.handler, 'setProjectName').rejects('Fake error');
        sandbox.spy(console, 'error');

        await command.execute();

        chai.assert.isTrue(console.error.calledOnce, 'console.error not called on handler.setProjectName failure');
    });

    it('should call handler.publish after handler.setProjectName', async () => {

        sandbox.stub(command.handler, 'setProjectName').resolves(undefined);
        const publishStub = sandbox.stub(command.handler, 'publish').resolves(undefined);

        await command.execute();

        chai.assert.isTrue(publishStub.calledOnce, 'handler.publish not called');
    });

    it('should console.error on handler.publish rejected', async () => {

        sandbox.stub(command.handler, 'setProjectName').resolves(undefined);
        sandbox.stub(command.handler, 'publish').rejects('fake error');
        sandbox.spy(console, 'error');

        await command.execute();

        chai.assert.isTrue(console.error.calledOnce, 'console.error not called on handler.publish failure');
    });

    it('should call print() after handler.publish', async () => {

        sandbox.stub(command.handler, 'setProjectName').resolves(undefined);
        sandbox.stub(command.handler, 'publish').resolves(undefined);
        const printSpy = sandbox.spy(command, 'print');

        await command.execute();

        chai.assert.isTrue(printSpy.calledOnce, 'print not called');
    });

    it('should call print should print expected results', async () => {

        const expectedResult = [{ 'Status': CliStatus.SUCCESS, 'Message': 'OK!' }];
        sandbox.stub(command.handler, 'setProjectName').resolves(undefined);
        sandbox.stub(command.handler, 'publish').resolves(undefined);
        sandbox.stub(command.handler, 'getResult').returns(expectedResult);

        await command.execute();

        chai.assert.isTrue(consTabStub.calledWith(expectedResult), `print should print ${JSON.stringify(expectedResult)}`);
    });
});
