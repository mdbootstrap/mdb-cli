'use strict';

const CommandResult = require('../../utils/command-result');
const sandbox = require('sinon').createSandbox();

describe('CommandResult', () => {

    let result;

    beforeEach(() => {

        result = new CommandResult();
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should get messages array', function () {

        const messages = result.messages;

        expect(messages).to.be.an('array');
    });

    describe('should fill messages array', function () {

        it('should add text line', function () {

            result.addTextLine('message');

            expect(result.messages).to.be.an('array');
            expect(result.messages[0].type).to.equal('text');
            expect(result.messages[0].value).to.equal('message');
        });

        it('should add table', function () {


            result.addTable([{ test: 'value' }]);

            expect(result.messages).to.be.an('array');
            expect(result.messages[0].type).to.equal('table');
            expect(result.messages[0].value).to.have.deep.members([{ test: 'value' }]);
        });

        it('should add alert', function () {

            result.addAlert('red', 'title', 'body');

            expect(result.messages).to.be.an('array');
            expect(result.messages[0].type).to.equal('alert');
            expect(result.messages[0].color).to.equal('red');
            expect(result.messages[0].value.title).to.equal('title');
            expect(result.messages[0].value.body).to.equal('body');
        });
    });

    describe('should emit live outputs', function () {

        it('should emit live text line', function () {

            sandbox.stub(result, 'emit');
            result.liveTextLine('message');

            expect(result.emit.called).to.be.true;
            expect(result.emit.calledWith('mdb.cli.live.output', { messages: [{ type: 'text', value: 'message' }] })).to.be.ok;
        });

        it('should emit live table', function () {

            sandbox.stub(result, 'emit');
            result.liveTable('message');

            expect(result.emit.called).to.be.true;
            expect(result.emit.calledWith('mdb.cli.live.output', { messages: [{ type: 'table', value: 'message' }] })).to.be.ok;
        });

        it('should emit live alert', function () {

            sandbox.stub(result, 'emit');
            result.liveAlert('red', 'title', 'body');

            expect(result.emit.called).to.be.true;
            expect(result.emit.calledWith('mdb.cli.live.output', { messages: [{ type: 'alert', value: { title: 'title', body: 'body' }, color: 'red' }] })).to.be.ok;
        });

        it('should emit live output', function () {

            sandbox.stub(result, 'emit');
            result._liveOutput({ type: 'text', value: 'test' });

            expect(result.emit.called).to.be.true;
            expect(result.emit.calledWith('mdb.cli.live.output', { messages: [{ type: 'text', value: 'test' }] })).to.be.ok;
        });
    });
});
