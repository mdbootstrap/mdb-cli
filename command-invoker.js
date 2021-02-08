'use strict';

const path = require('path');
const Context = require('./context');

/**
 * This is a class that decides which command to run based on provided arguments. It parses the <code>process.argv</code> array and
 * executes a command or throws an error. It's main methods are: <br>
 * <ul>
 *  <li> <code>parse()</code> </li>
 *  <li> <code>executeCommand()</code> </li>
 * </ul>
 */
class CommandInvoker {

    constructor() {
        this.entity = null;
        this.command = null;
        this.args = [];
        this.flags = [];

        /**
         * A collection of valid entities that can be provided as the first argument of the mdb command.
         *
         * @type {Set<string>}
         * @private
         */
        this._validEntities = new Set([
            'app', 'backend', 'blank', 'database', 'frontend', 'order', 'repo', 'starter', 'user', 'wordpress'
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
        this._validNonEntityCommands = new Set([
            'help', 'update', 'version', 'register', 'login', 'logout', 'ls', 'init', 'get', 'rename', 'publish', 'delete', 'whoami', 'logs', 'kill', 'info', 'restart', 'run', 'config'
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
        this._validFlagOnlyCommands = new Set([
            '-v', '--version'
        ]);

        /**
         * A collection of valid commands that are aliases to some other entity-command pair.
         *
         * @type {Set<string>}
         * @private
         */
        this._validAliasCommands = new Set([
            'starters', 'orders'
        ]);

        /**
         * An array of arguments (entity, command, args, flags) passed to the <code> mdb </code> command.
         *
         * @type {string[]}
         */
        this.argv = [];
    }

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
    parse(processArgv) {
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
    _isEntity(arg) {
        return this._validEntities.has(arg);
    }

    /**
     * If the `_validNonEntityCommands` Set has this value, it's a non-entity command.
     *
     * @param {string} arg
     * @returns {boolean}
     * @private
     */
    _isNonEntityCommand(arg) {
        return this._validNonEntityCommands.has(arg);
    }

    /**
     * If the `_validAliasCommands` Set has this value, it's an alias.
     *
     * @param {string} arg
     * @returns {boolean}
     * @private
     */
    _isAliasCommand(arg) {
        return this._validAliasCommands.has(arg);
    }

    /**
     * If it's a flag and the `_validFlagOnlyCommands` Set has this value, it's a flag-only command.
     *
     * @param arg
     * @returns {*|boolean}
     * @private
     */
    _isFlagOnlyCommand(arg) {
        return this._isFlag(arg) && this._validFlagOnlyCommands.has(arg);
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
    _isFlag(arg) {

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
    _consumeNext() {
        return this.argv.shift();
    }

    /**
     * Return but don't remove the first element from the current `argv` array
     *
     * @returns {string}
     * @private
     */
    _getNext() {
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
    _consumeUntil(stopCondition) {
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
    async executeCommand() {
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

    _getDefaultEntityForCommand(command) {
        switch (command) {
            case 'config':
                return 'config';
            case 'logs':
            case 'kill':
            case 'restart':
            case 'run':
                return 'backend';
            case 'help':
            case 'update':
            case 'version':
                return 'app';
            case 'whoami':
            case 'register':
            case 'login':
            case 'logout':
                return 'user';
            case 'publish':
            case 'ls':
            case 'delete':
            case 'get':
            case 'init':
            case 'info':
            case 'rename':
                return '';
            default:
                throw new Error('Invalid command');
        }
    }

    _getDefaultCommandForFlag(flag) {
        switch (flag) {
            case '-v':
            case '--version':
                return 'version';
            default:
                throw new Error('Invalid command');
        }
    }

    _resolveAlias(alias) {
        switch (alias) {
            case 'starters':
                return ['starter', 'ls'];
            case 'orders':
                return ['order', 'ls'];
        }
    }
}

module.exports = CommandInvoker;
