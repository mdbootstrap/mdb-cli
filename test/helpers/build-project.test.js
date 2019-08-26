'use strict';

const sinon = require('sinon');
const { expect, assert } = require('chai');

describe('Helper: buildProject', () => {

    const childProcess = require('child_process');
    const { buildProject } = require('../../helpers/build-project');
    const directoryPath = '/fake/directory/path';

    it('should call spawn method', (done) => {

        const fakeReturnedStream = { on : (event, cb) => cb() };
        const spawnStub = sinon.stub(childProcess, 'spawn').returns(fakeReturnedStream);     

        buildProject(directoryPath).catch(err => {
            if (err) console.log(err);
        });

        assert(spawnStub.called);
    
        spawnStub.reset();
        spawnStub.restore();

        done();
    });

    it('should spawn npm run build', (done) => {
        
        const fakeReturnedStream = { on : (event, cb) => cb() };
        const winStub = sinon.stub(process, 'platform').returns('linux');
        const isWindows = false;
        const spawnStub = sinon.stub(childProcess, 'spawn').returns(fakeReturnedStream);
        
        buildProject(directoryPath).catch(err => {
            if (err) console.log(err);
        });

        sinon.assert.calledWith(spawnStub, 'npm', ['run', 'build'], { cwd: directoryPath, stdio: 'inherit', ...(isWindows && { shell: true }) });

        spawnStub.reset();
        spawnStub.restore();
        winStub.reset();
        winStub.restore();

        done();
    });
    
    it('should reject if error occured', (done) => {

        const fakeReturnedStream = {
            on(event = 'error', cb) {
                if (event === 'error') cb(new Error());   
            }
        };
        const spawnStub = sinon.stub(childProcess, 'spawn').returns(fakeReturnedStream);

        buildProject(directoryPath)
            .catch(err => assert.isDefined(err))
            .finally(() => {
                spawnStub.reset();
                spawnStub.restore();
                done();
            });
    });

    it('should reject if status code is 1', (done) => {

        const fakeReturnedStream = {
            on(event = 'exit', cb) {
                if (event === 'exit') cb(1);   
            }
        };
        const spawnStub = sinon.stub(childProcess, 'spawn').returns(fakeReturnedStream);

        buildProject(directoryPath)
            .catch(err => expect(err).to.include({'Status': 1, 'Message': 'Problem with project building'}))
            .finally(() => {
                spawnStub.reset();
                spawnStub.restore();
                done();
            });
    });

    it('should resolve if status code is 0', (done) => {

        const fakeReturnedStream = {
            on(event = 'exit', cb) {
                if (event === 'exit') cb(0);  
            }
        };
        const spawnStub = sinon.stub(childProcess, 'spawn').returns(fakeReturnedStream);

        buildProject(directoryPath)
            .then(res => expect(res).to.include({'Status': 0, 'Message': 'Success'}))
            .finally(() => {
                spawnStub.reset();
                spawnStub.restore();
                done();
            });
    });
});