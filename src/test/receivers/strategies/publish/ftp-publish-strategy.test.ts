import fs from 'fs';
import fse from 'fs-extra';
import btoa from 'btoa';
import helpers from '../../../../helpers';
import Context from '../../../../context';
import CommandResult from '../../../../utils/command-result';
import { FtpPublishStrategy } from '../../../../receivers/strategies/publish';
import { createSandbox, SinonStub } from 'sinon';
import { expect } from 'chai';

describe('Strategy: FtpPublishStrategy', () => {

    const sandbox = createSandbox();

    let commandResult: CommandResult,
        context: Context,
        runBuildStub: SinonStub,
        strategy: FtpPublishStrategy;

    beforeEach(() => {
        runBuildStub = sandbox.stub(FtpPublishStrategy.prototype, 'runBuildScript').resolves();
        sandbox.stub(CommandResult.prototype, 'addAlert');
        commandResult = new CommandResult();
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    it('should not build project', async function () {

        context = new Context('', '', [], []);
        context.packageJsonConfig = {};
        strategy = new FtpPublishStrategy(context, commandResult);
        // @ts-ignore
        strategy._loadMetaData();

        await strategy.buildProject();

        expect(runBuildStub).to.not.have.been.called;
    });

    it('should build angular project', async function () {

        context = new Context('', '', [], []);
        context.packageJsonConfig = { scripts: { build: 'fake script' }, dependencies: { '@angular/core': 'fakever' } };
        strategy = new FtpPublishStrategy(context, commandResult);
        // @ts-ignore
        strategy._loadMetaData();

        sandbox.stub(helpers, 'deserializeJsonFile').resolves({ defaultProject: '' });
        sandbox.stub(fs, 'readFileSync').returns('');
        sandbox.stub(fs, 'writeFileSync');
        sandbox.stub(fse, 'moveSync');

        await strategy.buildProject();

        expect(runBuildStub).to.have.been.calledOnce;
    });

    it('should build react project', async function () {

        context = new Context('', '', [], []);
        context.packageJsonConfig = { scripts: { build: 'fake script' }, dependencies: { 'react': 'fakever' } };
        context.userToken = `fake.${btoa(JSON.stringify({ name: 'fakename' }))}.fake`;
        strategy = new FtpPublishStrategy(context, commandResult);
        // @ts-ignore
        strategy._loadMetaData();

        sandbox.stub(helpers, 'serializeJsonFile').resolves();
        sandbox.stub(fs, 'existsSync').returns(false);

        await strategy.buildProject();

        expect(runBuildStub).to.have.been.calledOnce;
    });

    it('should build vue project', async function () {

        context = new Context('', '', [], []);
        context.packageJsonConfig = { scripts: { build: 'fake script' }, dependencies: { 'vue': 'fakever' } };
        strategy = new FtpPublishStrategy(context, commandResult);
        // @ts-ignore
        strategy._loadMetaData();

        sandbox.stub(fs, 'existsSync').returns(true);

        await strategy.buildProject();

        expect(runBuildStub).to.have.been.calledOnce;
    });

    it('should build custom project', async function () {

        context = new Context('', '', [], []);
        context.packageJsonConfig = { scripts: { build: 'fake script' } };
        strategy = new FtpPublishStrategy(context, commandResult);
        // @ts-ignore
        strategy._loadMetaData();

        sandbox.stub(fs, 'existsSync').returns(true);

        await strategy.buildProject();

        expect(runBuildStub).to.have.been.calledOnce;
    });
});
