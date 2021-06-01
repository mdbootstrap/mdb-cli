'use strict';

import CommandResult from "../../utils/command-result";
import { expect } from 'chai';
import { createSandbox, SinonStub } from 'sinon';
import { OutputColor } from "../../models/output-color";

describe('CommandResult', () => {

    const sandbox = createSandbox();

    let result: CommandResult;

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

            result.addAlert(OutputColor.Green, 'title', 'body');

            expect(result.messages).to.be.an('array');
            expect(result.messages[0].type).to.equal('alert');
            expect(result.messages[0].value).to.be.an('object');
        });
    });

    describe('should emit live outputs', function () {

        it('should emit live text line', function () {

            const emitStub: SinonStub = sandbox.stub(result, 'emit');
            result.liveTextLine('message');

            expect(emitStub.called).to.be.true;
            expect(emitStub.calledWith('mdb.cli.live.output', { messages: [{ type: 'text', value: 'message' }] })).to.be.ok;
        });

        it('should emit live table', function () {

            const emitStub: SinonStub = sandbox.stub(result, 'emit');
            result.liveTable([{ test: 'message' }]);

            expect(emitStub.called).to.be.true;
            expect(emitStub.calledWith('mdb.cli.live.output', { messages: [{ type: 'table', value: [{ test: 'message' }] }] })).to.be.ok;
        });

        it('should emit live alert', function () {

            const emitStub: SinonStub = sandbox.stub(result, 'emit');
            result.liveAlert(OutputColor.Red, 'title', 'body');

            expect(emitStub.called).to.be.true;
            expect(emitStub.calledWith('mdb.cli.live.output', { messages: [{ type: 'alert', value: { title: 'title', body: 'body' }, color: 'red' }] })).to.be.ok;
        });
    });
});
