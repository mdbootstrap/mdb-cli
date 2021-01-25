'use strict';

const config = require('../../../config');
const GitManager = require('../../../utils/managers/git-manager');
const sandbox = require('sinon').createSandbox();
const childProcess = require('child_process');
const path = require('path');
const fs = require('fs');


describe('Utils: GitManager', () => {

    let manager;

    beforeEach(() => {

        sandbox.stub(process, 'platform').value('linux');
        manager = new GitManager();
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    describe('commands that do not display output', () => {

        const fakeBranch = 'fakeBranchName';

        let spawnStub, fakeReturnedStream;

        beforeEach(() => {

            fakeReturnedStream = { on: sandbox.stub(), stdout: { on: sandbox.stub() }, stderr: { on: sandbox.stub() } };
            spawnStub = sandbox.stub(manager, '_spawn');
        });

        describe('git rev-parse --abbrev-ref HEAD', () => {

            it('should resolve currnet branch name', async () => {

                fakeReturnedStream.stdout.on.withArgs('data').yields(`  ${fakeBranch}      `);
                spawnStub.returns(fakeReturnedStream);

                const result = await manager.currentBranch();

                expect(result).to.be.eq(fakeBranch);
            });

            it('should reject if error', async () => {

                fakeReturnedStream.stderr.on.withArgs('data').yields('Fake error');
                spawnStub.returns(fakeReturnedStream);

                try {

                    await manager.currentBranch();
                } catch (err) {

                    expect(err).to.be.eq('Fake error');
                }
            });
        });

        describe('git pull', () => {

            beforeEach(() => {

                sandbox.stub(console, 'log');
                sandbox.stub(console, 'error');
            });

            it('should resolve if the remote ref cannot be found', async () => {

                fakeReturnedStream.stdout.on.withArgs('data').yields(`Couldn't find remote ref ${fakeBranch}`);
                fakeReturnedStream.on.withArgs('exit').yields(1);
                spawnStub.returns(fakeReturnedStream);

                const result = await manager.pull(fakeBranch);

                expect(result).to.be.undefined;
            });

            it('should resolve if exit code is 0', async () => {

                fakeReturnedStream.on.withArgs('exit').yields(0);
                spawnStub.returns(fakeReturnedStream);

                const result = await manager.pull(fakeBranch);

                expect(result).to.be.undefined;
            });

            it('should reject if error', async () => {

                const expectedResult = 'Problem with project fetching from GitLab.';
                fakeReturnedStream.stderr.on.withArgs('data').yields('Fake error');
                fakeReturnedStream.on.withArgs('exit').yields(1);
                spawnStub.returns(fakeReturnedStream);

                try {

                    await manager.pull(fakeBranch);
                } catch (err) {

                    expect(err).to.be.eq(expectedResult);
                }
            });
        });

        describe('git status', () => {

            it('should resolve if nothing to commit', async () => {

                fakeReturnedStream.stdout.on.withArgs('data').yields('nothing to commit, working tree clean');
                spawnStub.returns(fakeReturnedStream);

                const result = await manager.status();

                expect(result).to.be.undefined;
            });

            it('should reject if there are changes for commit', async () => {

                const expectedResult = 'You have uncommited changes in your project, please commit and try again.';
                fakeReturnedStream.stdout.on.withArgs('data').yields('Changes not staged for commit');
                spawnStub.returns(fakeReturnedStream);

                try {

                    await manager.status();
                } catch (err) {

                    expect(err).to.be.eq(expectedResult);
                }
            });

            it('should reject if error', async () => {

                fakeReturnedStream.stderr.on.withArgs('data').yields('Fake error');
                spawnStub.returns(fakeReturnedStream);

                try {

                    await manager.status();
                } catch (err) {

                    expect(err).to.be.eq('Fake error');
                }
            });
        });
    });

    describe('commands that display output', () => {

        let taskStub;

        beforeEach(() => {

            taskStub = sandbox.stub(manager, '_task');
        });

        it('git checkout master', () => {

            manager.checkout();

            sandbox.assert.calledWith(taskStub, ['checkout', '-B', 'master'], `Switched to branch master.`, 'Problem with git branch change.');
        });

        it('git checkout branch_name', () => {

            manager.checkout('branch_name');

            sandbox.assert.calledWith(taskStub, ['checkout', '-B', 'branch_name'], `Switched to branch branch_name.`, 'Problem with git branch change.');
        });

        it('git clone repo.url', () => {

            manager.clone('repo.url');

            sandbox.assert.calledWith(taskStub, ['clone', 'repo.url'], 'Success.', 'There were some errors. Please try again.');
        });

        it('git clone repo.url project_name', () => {

            manager.clone('repo.url', 'project_name');

            sandbox.assert.calledWith(taskStub, ['clone', 'repo.url', 'project_name'], 'Success.', 'There were some errors. Please try again.');
        });

        it('git merge branch_name', () => {

            manager.merge('branch_name');

            sandbox.assert.calledWith(taskStub, ['merge', 'branch_name'], undefined, 'Problem with git branch merge.');
        });

        it('git push branch_name', () => {

            manager.push('branch_name');

            sandbox.assert.calledWith(taskStub, ['push', '-u', 'origin', 'branch_name'], undefined, 'Problem with uploading to GitLab.');
        });

        describe('git commit', () => {

            const filename = 'fake-filename', message = 'Fake commit message';

            it('on linux', async () => {

                taskStub.resolves();
    
                await manager.commit(filename, message);
    
                sandbox.assert.calledWith(taskStub, ['add', filename], undefined, 'Problem with git add command.');
                sandbox.assert.calledWith(taskStub, ['commit', '-m', message], undefined, 'Problem with git commit command.');
            });
    
            it('on windows', async () => {
    
                sandbox.stub(process, 'platform').value('win32');
                manager = new GitManager();
                taskStub = sandbox.stub(manager, '_task').resolves();
    
                await manager.commit(filename, message);
    
                sandbox.assert.calledWith(taskStub, ['add', filename], undefined, 'Problem with git add command.');
                sandbox.assert.calledWith(taskStub, ['commit', '-m', `"${message}"`], undefined, 'Problem with git commit command.');
            });
    
            it('on error', async () => {
    
                taskStub.rejects('Fake error');
    
                try {
                    await manager.commit(filename, message);
                } catch (err) {
                    sandbox.assert.calledWith(taskStub, ['add', filename], undefined, 'Problem with git add command.');
                    expect(err.name).to.be.eq('Fake error');
                }
            });
        });
    });

    describe('Method: _task', () => {

        const cmd = 'git',
            args = ['fake', 'args'],
            successMsg = 'Fake success message',
            errorMsg = 'Fake error message',
            cwd = 'fake/cwd';

        let spawnStub;

        beforeEach(() => {

            spawnStub = sandbox.stub(childProcess, 'spawn');
        });

        it('should call child process spawn method with expected arguments on linux and return success message', async () => {

            const on = sandbox.stub();
            on.withArgs('exit').yields(0);
            spawnStub.returns({ on });

            const result = await manager._task(args, successMsg, errorMsg, cwd);

            sandbox.assert.calledWith(spawnStub, cmd, args, { cwd, stdio: 'inherit' });
            expect(result).to.be.eq(successMsg);
        });

        it('should call child process spawn method with expected arguments on windows and return success message', async () => {

            sandbox.stub(process, 'platform').value('win32');
            manager = new GitManager();
            manager.cwd = cwd;
            const on = sandbox.stub();
            on.withArgs('exit').yields(0);
            spawnStub.returns({ on });

            const result = await manager._task(args, successMsg, errorMsg);

            sandbox.assert.calledWith(spawnStub, cmd, args, { cwd, stdio: 'inherit', shell: true });
            expect(result).to.be.eq(successMsg);
        });

        it('should call child process spawn method with expected arguments on linux and throw error', async () => {

            const on = sandbox.stub();
            on.withArgs('exit').yields(1);
            spawnStub.returns({ on });

            try {
                await manager._task(args, successMsg, errorMsg, cwd);
            } catch (err) {
                sandbox.assert.calledWith(spawnStub, cmd, args, { cwd, stdio: 'inherit' });
                expect(err).to.be.eq(errorMsg);
            }
        });

        it('should call child process spawn method with expected arguments on windows and throw error', async () => {

            const fakeErr = 'Fake error';
            sandbox.stub(process, 'platform').value('win32');
            manager = new GitManager();
            const on = sandbox.stub();
            on.withArgs('error').yields(fakeErr);
            spawnStub.returns({ on });

            try {
                await manager._task(args, successMsg, errorMsg, cwd);
            } catch (err) {
                sandbox.assert.calledWith(spawnStub, cmd, args, { cwd, stdio: 'inherit', shell: true });
                expect(err).to.be.eq(fakeErr);
            }
        });
    });

    describe('Method: getCurrentRemoteUrl', () => {

        const fakeUrl = 'https://fake.gitlab.url';
        const fakeFileContent = `[remote "origin"]\n\turl = ${fakeUrl}`;

        let existsSyncStub, readFileSyncStub;

        beforeEach(() => {

            sandbox.stub(path, 'join').returns('fake/path');
            existsSyncStub = sandbox.stub(fs, 'existsSync');
            readFileSyncStub = sandbox.stub(fs, 'readFileSync');
        });

        it('should return empty string if git config file doesn\'t exist', async () => {

            existsSyncStub.returns(false);

            const result = manager.getCurrentRemoteUrl();

            expect(result).to.be.eq('');
        });

        it('should return empty string if there is no remote url', async () => {

            existsSyncStub.returns(true);
            readFileSyncStub.returns('');

            const result = manager.getCurrentRemoteUrl();

            expect(result).to.be.eq('');
        });

        it('should return empty string if url does not match', async () => {

            sandbox.stub(config, 'gitlabUrl').value('https://fake.url');
            existsSyncStub.returns(true);
            readFileSyncStub.returns(fakeFileContent);

            const result = manager.getCurrentRemoteUrl();

            expect(result).to.be.eq('');
        });

        it('should return current remote url', async () => {

            sandbox.stub(config, 'gitlabUrl').value(fakeUrl);
            existsSyncStub.returns(true);
            readFileSyncStub.returns(fakeFileContent);

            const result = manager.getCurrentRemoteUrl();

            expect(result).to.be.eq(fakeUrl);
        });
    });
});
