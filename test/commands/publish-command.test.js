'use strict';

const AuthHandler = require('../../utils/auth-handler');
const sinon = require('sinon');
const chai = require('chai');
const { expect } = require('chai');

describe('Command: publish', () => {

    let authHandler;
    let command;

    beforeEach(() => {

        const commandClass = require('../../commands/publish-command');
        authHandler = new AuthHandler(false);

        command = new commandClass(authHandler);
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
        const setProjectNameStub = sinon.stub(command.handler, 'setProjectName').returns(fakeReturnedPromise);

        chai.assert.isTrue(!setProjectNameStub.called, 'HttpWrapper.setProjectName called');

        command.execute();

        chai.assert.isTrue(setProjectNameStub.calledOnce, 'HttpWrapper.setProjectName not called');

        setProjectNameStub.reset();
        setProjectNameStub.restore();
    });

    it('should call buildProject before publish if build script exists', async () => {

        const buildProject = require('../../helpers/build-project');
        const deserializeJsonFile = require('../../helpers/deserialize-object-from-file');

        const deserializeStub = sinon.stub(deserializeJsonFile, 'deserializeJsonFile').resolves({scripts: {build: 'build'}});
        const buildStub = sinon.stub(buildProject, 'buildProject').resolves();
        
        await command.execute();

        expect(buildStub.calledAfter(deserializeStub)).to.equal(true);

        buildStub.reset();
        buildStub.restore();
        deserializeStub.reset();
        deserializeStub.restore();
    });

    it('should add dist folder to project path after buildProject', async () => {

        const buildProject = require('../../helpers/build-project');
        const deserializeJsonFile = require('../../helpers/deserialize-object-from-file');

        const deserializeStub = sinon.stub(deserializeJsonFile, 'deserializeJsonFile').resolves({scripts: {build: 'build'}});
        const buildStub = sinon.stub(buildProject, 'buildProject').resolves();
        
        await command.execute();

        expect(command.handler.cwd.endsWith('dist')).to.equal(true);

        buildStub.reset();
        buildStub.restore();
        deserializeStub.reset();
        deserializeStub.restore();
    });

    it('should console.error on handler.setProjectName rejected', async () => {

        const handlerStub = sinon.stub(command.handler, 'setProjectName').rejects('Fake error');
        sinon.spy(console, 'error');

        await command.execute();

        chai.assert.isTrue(console.error.calledOnce, 'console.error not called on handler.setProjectName failure');

        handlerStub.reset();
        handlerStub.restore();
        console.error.restore();
    });

    it('should call handler.publish after handler.setProjectName', async () => {

        const setProjectNameStub = sinon.stub(command.handler, 'setProjectName').resolves(undefined);
        const publishStub = sinon.stub(command.handler, 'publish').resolves(undefined);

        await command.execute();

        chai.assert.isTrue(publishStub.calledOnce, 'handler.publish not called');

        setProjectNameStub.reset();
        publishStub.reset();
        setProjectNameStub.restore();
        publishStub.restore();
    });

    it('should console.error on handler.publish rejected', async () => {

        const setProjectNameStub = sinon.stub(command.handler, 'setProjectName').resolves(undefined);
        const publishStub = sinon.stub(command.handler, 'publish').rejects('fake error');
        sinon.spy(console, 'error');

        await command.execute();

        chai.assert.isTrue(console.error.calledOnce, 'console.error not called on handler.publish failure');

        setProjectNameStub.reset();
        setProjectNameStub.restore();
        publishStub.reset();
        publishStub.restore();
        console.error.restore();
    });

    it('should call print() after handler.publish', async () => {

        const setProjectNameStub = sinon.stub(command.handler, 'setProjectName').resolves(undefined);
        const publishStub = sinon.stub(command.handler, 'publish').resolves(undefined);
        const printSpy = sinon.spy(command, 'print');

        await command.execute();

        chai.assert.isTrue(printSpy.calledOnce, 'print not called');

        setProjectNameStub.reset();
        setProjectNameStub.restore();
        publishStub.reset();
        publishStub.restore();
        printSpy.restore();
    });

    it('should call print should print expected results', async () => {

        const expectedResult = [{ 'Status': 'passed', 'Message': 'OK!'}];
        const setProjectNameStub = sinon.stub(command.handler, 'setProjectName').resolves(undefined);
        const publishStub = sinon.stub(command.handler, 'publish').resolves(undefined);
        const getResultStub = sinon.stub(command.handler, 'getResult').returns(expectedResult);
        const consoleSpy = sinon.spy(console, 'table');

        await command.execute();

        chai.assert.isTrue(consoleSpy.calledWith(expectedResult), `print should print ${JSON.stringify(expectedResult)}`);

        setProjectNameStub.reset();
        setProjectNameStub.restore();
        publishStub.reset();
        publishStub.restore();
        getResultStub.reset();
        getResultStub.restore();
        console.table.restore();
    });

});
