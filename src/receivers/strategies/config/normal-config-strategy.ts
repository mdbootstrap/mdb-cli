import Context from '../../../context';
import CommandResult from '../../../utils/command-result';

class NormalConfigStrategy {

    private context: Context;
    private result: CommandResult;

    constructor(context: Context, result: CommandResult) {
        this.context = context;
        this.result = result;
    }

    setValue(name: string, value: string): void {
        this._validate(name, value);
        const global = this._getGlobalFlag();
        this.context.mdbConfig.setValue(name, value, global);
        this.context.mdbConfig.save(process.cwd(), global);
    }

    unsetValue(name: string): void {
        const global = this._getGlobalFlag();
        this.context.mdbConfig.unsetValue(name, global);
        this.context.mdbConfig.save(process.cwd(), global);
    }

    private _getGlobalFlag(): boolean {
        const flags = this.context.getParsedFlags();
        return flags.global ? flags.global as boolean : false;
    }

    private _validate(name: string, value: string): void {
        switch (name) {
            case 'packageManager':
                if (!['npm', 'yarn'].includes(value)) throw new Error('Invalid value, allowed package managers: npm, yarn');
                break;
            case 'publishMethod':
                if (!['ftp', 'pipeline'].includes(value)) throw new Error('Invalid value, allowed publish methods: ftp, pipeline');
                break;
            default:
                break;
        }
    }
}

export default NormalConfigStrategy;
