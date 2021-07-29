import Context from '../../../context';
import CommandResult from '../../../utils/command-result';
import ConfigStrategy from "./config-strategy";

class NormalConfigStrategy extends ConfigStrategy {

    private context: Context;
    private result: CommandResult;

    constructor(context: Context, result: CommandResult) {
        super();

        this.context = context;
        this.result = result;
    }

    setValue(name: string, value: string): string {
        this._validate(name, value);
        const global = this._getGlobalFlag();
        this.context.mdbConfig.setValue(name, value, global);
        this.context.mdbConfig.save(process.cwd(), global);
        return '';
    }

    unsetValue(name: string): string {
        const global = this._getGlobalFlag();
        this.context.mdbConfig.unsetValue(name, global);
        this.context.mdbConfig.save(process.cwd(), global);
        return '';
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
