'use strict';

const FtpPublishStrategy = require('../../../../receivers/strategies/publish/ftp-publish-strategy');
const Context = require('../../../../context');
const HttpWrapper = require('../../../../utils/http-wrapper');
const ArchiverWrapper = require('../../../../helpers/archiver-wrapper');
const helpers = require('../../../../helpers');
const config = require('../../../../config');
const fs = require('fs');
const fse = require('fs-extra');
const btoa = require('btoa');

const sandbox = require('sinon').createSandbox();

describe('Strategy: FtpPublishStrategy', () => {

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    it('should not build project', async function () {

        const context = new Context('', '', [], []);
        context.packageJsonConfig = {};

        const strategy = new FtpPublishStrategy(context, null);
        strategy.result = { addAlert: sandbox.stub() };

        const runBuildStub = sandbox.stub(strategy, 'runBuildScript').resolves();

        await strategy.buildProject();

        expect(runBuildStub).to.not.have.been.called;
    });

    it('should build angular project', async function () {

        const context = new Context('', '', [], []);
        context.packageJsonConfig = { scripts: { build: 'fake script' }, dependencies: { '@angular/core': 'fakever' } };

        const strategy = new FtpPublishStrategy(context, null);
        strategy.result = { addAlert: sandbox.stub() };

        sandbox.stub(helpers, 'deserializeJsonFile').resolves({ defaultProject: '' });
        sandbox.stub(fs, 'readFileSync').returns('');
        sandbox.stub(fs, 'writeFileSync');
        sandbox.stub(fse, 'moveSync');

        const runBuildStub = sandbox.stub(strategy, 'runBuildScript').resolves();

        await strategy.buildProject();

        expect(runBuildStub).to.have.been.calledOnce;
    });

    it('should build react project', async function () {

        const context = new Context('', '', [], []);
        context.packageJsonConfig = { scripts: { build: 'fake script' }, dependencies: { 'react': 'fakever' } };
        context.userToken = `fake.${btoa(JSON.stringify({ name: 'fakename' }))}.fake`;

        const strategy = new FtpPublishStrategy(context, null);
        strategy.result = { addAlert: sandbox.stub() };

        sandbox.stub(helpers, 'serializeJsonFile').resolves();
        sandbox.stub(fs, 'existsSync').returns(false);

        const runBuildStub = sandbox.stub(strategy, 'runBuildScript').resolves();

        await strategy.buildProject();

        expect(runBuildStub).to.have.been.calledOnce;
    });

    it('should build vue project', async function () {

        const context = new Context('', '', [], []);
        context.packageJsonConfig = { scripts: { build: 'fake script' }, dependencies: { 'vue': 'fakever' } };

        const strategy = new FtpPublishStrategy(context, null);
        strategy.result = { addAlert: sandbox.stub() };

        sandbox.stub(fs, 'existsSync').returns(true);

        const runBuildStub = sandbox.stub(strategy, 'runBuildScript').resolves();

        await strategy.buildProject();

        expect(runBuildStub).to.have.been.calledOnce;
    });

    it('should build custom project', async function () {

        const context = new Context('', '', [], []);
        context.packageJsonConfig = { scripts: { build: 'fake script' } };

        const strategy = new FtpPublishStrategy(context, null);
        strategy.result = { addAlert: sandbox.stub() };

        sandbox.stub(fs, 'existsSync').returns(true);
        const runBuildStub = sandbox.stub(strategy, 'runBuildScript').resolves();

        await strategy.buildProject();

        expect(runBuildStub).to.have.been.calledOnce;
    });
});
