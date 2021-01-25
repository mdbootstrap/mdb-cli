'use strict';

const fs = require('fs');
const DotMdbConfigManager = require('../../../utils/managers/dot-mdb-config-manager');
const sandbox = require('sinon').createSandbox();

describe('DotMdbConfigManager', () => {

    let config;

    beforeEach(() => {
        config = new DotMdbConfigManager();
    });

    afterEach(() => {
        sandbox.reset();
        sandbox.restore();
    });

    describe('should validate key path against scheme', function () {

        it('should fail for invalid keypath', function (done) {
            try {
                config.validateConfigKey('invalid.key.path');
            } catch (e) {
                done();
            }

            chai.assert.fail('validateConfigKey() should fail for invalid keypath');
        });

        it('should pass for valid simple key', function () {
            config.validateConfigKey('domain');
        });

        it('should pass for valid nested keypath', function () {
            config.validateConfigKey('meta.starter');
        });
    });

    describe('should retrieve value', function () {

        it('should get specified simple key', function () {
            const fakeValue = 'fake';
            config.mdbConfig.domain = fakeValue;

            const result = config.getValue('domain');

            expect(result).to.eq(fakeValue);
        });

        it('should get specified nested keypath', function () {

            const fakeValue = 'fake';
            config.mdbConfig.meta = { starter: fakeValue };

            const result = config.getValue('meta.starter');

            expect(result).to.eq(fakeValue);
        });

        it('should return undefined for non-existent but valid simple key', function () {

            const result = config.getValue('domain');

            expect(result).to.be.undefined;
        });

        it('should return undefined for non-existent but valid nested keypath', function () {

            const result = config.getValue('meta.starter');

            expect(result).to.be.undefined;
        });
    });

    describe('should set key value', function () {

        it('should set a value for non-existent simple key', function () {
            const fakeValue = 'fake';
            config.setValue('domain', fakeValue);

            expect(config.mdbConfig.domain).to.eq(fakeValue);
        });

        it('should set a value for non-existent nested keypath', function () {

            const fakeValue = 'fake';
            config.setValue('meta.starter', fakeValue);

            expect(config.mdbConfig.meta.starter).to.eq(fakeValue);
        });

        it('should update existent value for simple key', function () {

            const fakeValue = 'fake';
            config.mdbConfig.domain = '';
            config.setValue('domain', fakeValue);

            expect(config.mdbConfig.domain).to.eq(fakeValue);
        });

        it('should update existent value for nested keypath', function () {

            const fakeValue = 'fake';
            config.mdbConfig.meta = { starter: '' };
            config.setValue('meta.starter', fakeValue);

            expect(config.mdbConfig.meta.starter).to.eq(fakeValue);
        });
    });

    describe('should unset key', function () {

        it('should unset simple key', function () {

            config.mdbConfig.domain = 'fake';
            config.unsetValue('domain');

            expect(config.mdbConfig.domain).to.be.undefined;
        });

        it('should unset nested keypath', function () {

            config.mdbConfig.meta = { starter: 'fake' };
            config.unsetValue('meta.starter');

            expect(config.mdbConfig.meta.starter).to.be.undefined;
        });
    });

    it('should save config to .mdb file', function () {
        const writeFileStub = sandbox.stub(fs, 'writeFileSync');

        config.save();

        expect(writeFileStub).to.have.been.calledOnce;
        expect(writeFileStub.getCall(0).args[0]).to.include('.mdb');
    });

    it('should throw error when failed to save config', function (done) {

        sandbox.stub(fs, 'writeFileSync').throws(new Error('fake error'));

        try {
            config.save();
        } catch (e) {
            expect(e.message).to.include('fake error');
            return done();
        }

        chai.assert.fail('save() should throw an error if fs error occur');
    });

    it('should load config from .mdb file', function () {

        const fakeDotMdbConfig = JSON.stringify({ key: 'value' });

        sandbox.stub(fs, 'readFileSync').returns(fakeDotMdbConfig);

        config._load();

        expect(config.mdbConfig).to.deep.eq(JSON.parse(fakeDotMdbConfig));
    });

    it('should set config if failed to load .mdb file', function () {

        const fakeError = new Error('fake error');
        sandbox.stub(fs, 'readFileSync').throws(fakeError);

        config._load();

        expect(config.mdbConfig).to.be.an('object').that.is.empty;
    });
});
