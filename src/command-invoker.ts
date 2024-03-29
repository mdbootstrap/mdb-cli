'use strict';

import path from "path";
import Context from "./context";

type Entity = 'app' | 'backend' | 'blank' | 'database' | 'frontend' | 'order' | 'repo' | 'starter' | 'user' | 'wordpress' | 'config' | 'compose' | '';
type NonEntityCommand = 'help' | 'update' | 'version' | 'register' | 'login' | 'logout' | 'ls' | 'init' | 'get' | 'rename' | 'publish' | 'delete' | 'whoami' | 'logs' | 'kill' | 'info' | 'restart' | 'run' | 'config' | 'status';
type FlagOnlyCommand = '-h' | '--help' | '-v' | '--version';
type AliasCommand = 'orders' | 'starters';

/**
 * This is a class that decides which command to run based on provided arguments. It parses the <code>process.argv</code> array and
 * executes a command or throws an error. It's main methods are: <br>
 * <ul>
 *  <li> <code>parse()</code> </li>
 *  <li> <code>executeCommand()</code> </li>
 * </ul>
 */
class CommandInvoker {

    private entity: Entity = '';
    private command = '';
    private args: string[] = [];
    private flags: string[] = [];

    /**
     * A collection of valid entities that can be provided as the first argument of the mdb command.
     *
     * @type {Set<string>}
     * @private
     */
    private _validEntities: Set<Entity> = new Set<Entity>([
        'app', 'backend', 'blank', 'compose', 'database', 'frontend', 'order', 'repo', 'starter', 'user', 'wordpress'
    ]);

    /**
     * A collection of valid commands that do not require an entity to be provided. It's the case when we make the
     *
     * <pre> $ mdb <command> </pre>
     *
     * call. The entity will be guessed based on the command used.
     *
     * @type {Set<string>}
     * @private
     */
    private _validNonEntityCommands: Set<NonEntityCommand> = new Set<NonEntityCommand>([
        'help', 'update', 'version', 'register', 'login', 'logout', 'ls', 'init', 'get', 'rename', 'publish', 'delete', 'whoami', 'logs', 'kill', 'info', 'restart', 'run', 'config', 'status'
    ]);

    /**
     * A collection of valid flags that do not require neither an entity nor a command to be provided. It's the case when we make the
     *
     * <pre> $ mdb <flag> </pre>
     *
     * call. The entity and command will be guessed based on the flag used.
     *
     * @type {Set<string>}
     * @private
     */
    private _validFlagOnlyCommands: Set<FlagOnlyCommand> = new Set<FlagOnlyCommand>([
        '-h', '--help',
        '-v', '--version'
    ]);

    /**
     * A collection of valid commands that are aliases to some other entity-command pair.
     *
     * @type {Set<string>}
     * @private
     */
    private _validAliasCommands: Set<AliasCommand> = new Set<AliasCommand>([
        'starters', 'orders'
    ]);

    /**
     * An array of arguments (entity, command, args, flags) passed to the <code> mdb </code> command.
     *
     * @type {string[]}
     */
    private argv: string[] = [];


    /**
     * A method that does the main job which is parsing the arguments and selecting the proper entity, command, args and flags.
     *
     * Now, the command usage is as follows: <br>
     *
     *     <pre> mdb &lt;entity&gt; &lt;command&gt; [args] [flags] </pre>
     *
     * and the parsing logic goes like this (in <string>that</strong> order):
     *
     * <ol>
     *     <li> If the first argument is an entity, then the next argument must be a command. Then, all of the arguments until the first flag are args. The rest are flags. </li>
     *     <li> If the first argument is a non-entity command, then obviously it's a command. The entity is selected based on the entity-command mapping which is defined in the <code>_getDefaultEntityForCommand()</code> method and is just hardcoded. Again, all of the arguments until the first flag are args. The rest are flags. </li>
     *     <li> If the first argument is an alias, then resolve alias and select an entity-command pair. Again, this is hardcoded in the <code>_resolveAlias()</code> method. Again, all of the arguments until the first flag are args. The rest are flags. </li>
     *     <li> If the first argument is a flag-only command, then select the command using the <code>_getDefaultCommandForFlag()</code> method with hardcoded mapping. Based on that command, select the entity (from hardcoded mapping in <code>_getDefaultEntityForCommand()</code> method). Again, all of the arguments until the first flag are args. The rest are flags. </li>
     *     <li> If the first argument is not any of the above, throw an error </li>
     * </ol>
     *
     * @param {string[]} processArgv An array of arguments passed to the <code> mdb </code> command. It's <code> process.argv </code>
     * @throws If the first argument cannot be classified as an entity, a non-entity command, an alias or a flag-only command, throw an <code>Invalid command: mdb &lt;command&gt;</code> error.
     */
    parse(processArgv: string[]) {
        this.argv = processArgv.slice(2);

        const firstArg = this._consumeNext();

        if (this._isEntity(firstArg)) {
            this.entity = firstArg;
            this.command = this._consumeNext();
            this.args = this._consumeUntil((next) => this._isFlag(next));
            this.flags.push(...this.argv);
        } else if (this._isNonEntityCommand(firstArg)) {
            this.command = firstArg;
            this.entity = this._getDefaultEntityForCommand(this.command);
            this.args = this._consumeUntil((next) => this._isFlag(next));
            this.flags.push(...this.argv);
        } else if (this._isAliasCommand(firstArg)) {
            [this.entity, this.command] = this._resolveAlias(firstArg);
            this.args = this._consumeUntil((next) => this._isFlag(next));
            this.flags.push(...this.argv);
        } else if (this._isFlagOnlyCommand(firstArg)) {
            this.command = this._getDefaultCommandForFlag(firstArg);
            this.entity = this._getDefaultEntityForCommand(this.command);
            this.flags = this.argv.slice();
        } else if (firstArg === undefined) {
            this.command = 'help';
        } else {
            throw new Error(`Invalid command: mdb ${processArgv.slice(2).join(' ')}`);
        }
    }

    /**
     * If the `_validEntities` Set has this value, it's an entity.
     *
     * @param {string} arg
     * @returns {boolean}
     * @private
     */
    private _isEntity(arg: string): arg is Entity {
        return this._validEntities.has(arg as Entity);
    }

    /**
     * If the `_validNonEntityCommands` Set has this value, it's a non-entity command.
     *
     * @param {string} arg
     * @returns {boolean}
     * @private
     */
    private _isNonEntityCommand(arg: string): arg is NonEntityCommand {
        return this._validNonEntityCommands.has(arg as NonEntityCommand);
    }

    /**
     * If the `_validAliasCommands` Set has this value, it's an alias.
     *
     * @param {string | AliasCommand} arg
     * @returns {boolean}
     * @private
     */
    private _isAliasCommand(arg: string): arg is AliasCommand {
        return this._validAliasCommands.has(arg as AliasCommand);
    }

    /**
     * If it's a flag and the `_validFlagOnlyCommands` Set has this value, it's a flag-only command.
     *
     * @param arg
     * @returns {*|boolean}
     * @private
     */
    private _isFlagOnlyCommand(arg: string): arg is FlagOnlyCommand {
        return this._isFlag(arg) && this._validFlagOnlyCommands.has(arg as FlagOnlyCommand);
    }

    /**
     * If it starts with a `-` it's a flag.
     * Throws error if flag contain `=` instead of space.
     *
     * @param {string} arg
     * @returns {boolean}
     * @throws Error
     * @private
     */
    private _isFlag(arg: string): boolean {

        const isFlag = !!arg && arg.startsWith('-');

        if (isFlag && arg.includes('='))
            throw new Error('Please use space instead of `=` on flags');

        return isFlag;
    }

    /**
     * Remove and return the first element of the current `argv` array.
     *
     * @returns {string}
     * @private
     */
    private _consumeNext(): string {
        return this.argv.shift() as string;
    }

    /**
     * Return but don't remove the first element from the current `argv` array
     *
     * @returns {string}
     * @private
     */
    private _getNext(): string {
        return this.argv[0];
    }

    /**
     * A function that is applied to each element and if it returns `true` the element will be added to the returning collection.
     *
     * @typedef StopCondition
     * @function
     * @param {string} next
     * @return {boolean}
     */

    /**
     * Remove and return elements from the `argv` array until the `stopCondition` predicate function returns true or until there are still elements in the array.
     * As long as the `stopCondition` predicate returns `true`
     *
     * @param {StopCondition} stopCondition
     * @returns {string[]}
     * @private
     */
    private _consumeUntil(stopCondition: (next: string) => boolean): string[] {
        const consumed = [];
        let next = this._getNext();
        while (!stopCondition(next) && next !== undefined) {
            consumed.push(this._consumeNext());
            next = this._getNext();
        }

        return consumed;
    }

    /**
     * A method that based on the selected command, imports the proper <code>Command</code> file and calls the <code>execute()</code> method on it.
     *
     * @async
     * @returns {Promise<void>}
     */
    async executeCommand(): Promise<void> {
        try {
            const ctx = new Context(this.entity, this.command, this.args, this.flags);
            const CommandClass = require(path.resolve(__dirname, 'commands', `${this.command}-command`));
            const command = new CommandClass(ctx);
            await command.execute();
        } catch (e) {
            if (e.message && e.message.toLowerCase().startsWith('cannot find module')) {
                throw new Error(`Invalid command: ${this.command}`);
            } else {
                throw e;
            }
        }
    }

    private _getDefaultEntityForCommand(command: string): Entity {
        switch (command) {
            case 'config':
                return 'config';
            case 'logs':
            case 'kill':
                return 'backend';
            case 'compose':
            case 'help':
            case 'update':
            case 'version':
                return 'app';
            case 'whoami':
            case 'register':
            case 'login':
            case 'logout':
            case 'status':
                return 'user';
            case 'delete':
            case 'get':
            case 'info':
            case 'init':
            case 'ls':
            case 'publish':
            case 'rename':
            case 'restart':
            case 'run':
                return '';
            default:
                throw new Error('Invalid command');
        }
    }

    private _getDefaultCommandForFlag(flag: string): string {
        switch (flag) {
            case '-v':
            case '--version':
                return 'version';
            case '-h':
            case '--help':
                return 'help';
            default:
                throw new Error('Invalid command');
        }
    }

    private _resolveAlias(alias: AliasCommand): [Entity, string] {
        switch (alias) {
            case 'starters':
                return ['starter', 'ls'];
            case 'orders':
                return ['order', 'ls'];
        }
    }
}

export default CommandInvoker;
