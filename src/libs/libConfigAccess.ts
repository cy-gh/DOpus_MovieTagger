///<reference path='../std/libStdDev.ts' />
///<reference path='./formatters.ts' />


/**
 * # What is it?
 *
 * This library makes access to configuration variables easier,
 * by unifying the reading, writing and validating of user variables
 * using the assigned type to each variable.
 *
 * For example, if you set up a variable as JSON or REGEXP,
 * it will be automatically validated after a user change.
 * If the new user input is invalid, the default value from the script will be used.
 * This has the advantage that a typo does not crash the script.
 *
 * The access to config is restricted to singletons, as each user script
 * can have one instance in DOpus. The singletons are the following:
 *
 * * **config.user**: access to UI-based configuration variables
 * * **config.ext**: access to external, JSON-based variables
 *
 * The first is probably the one you already know from DOpus User Scripts UI.
 * The latter is for configuring your script during its initialization phase.
 * Some script items, such as script column headings, can be set only during `OnInit()`
 * phase and DOpus will not allow you to read Script.config during initializaton.
 * Your script can reading an external JSON file and
 * call either `addValue()` or store the entire JSON by calling the `config.ext.addPOJO()` method
 * and can immediately use the variable(s) in `OnInit()`, or later of course.
 *
 * Variables added to config.ext will **not** visible in DOpus UI, as explained above.
 *
 *
 * # How to use:
 *
 * If you want to use more than just fullpath/path/isOSP variables,
 * but also variables which are user-configurable via DOpus Scripts UI,
 * write any function callable during `OnInit()`, e.g.
 * ```typescript
 *   function setupConfigVars(initData: DOpusScriptInitData) {
 *     // Top level function.
 *     // More to this below.
 *   }
 * ```
 *
 * in OnInit() call it with the scriptInitData you get automatically from DOpus, e.g.
 * ```typescript
 *   setupConfigVars(initData);
 *   // note that this will also call config.user.setInitData(initData)
 * ```
 *
 * Your `setupConfigVars()` method should look like this
 * ```typescript
 *   //
 *   // config.user: UI-configured settings
 *   //
 *   config.user.setInitData(initData); // very important!
 *   // ...
 *   config.user.addNumber(...)
 *   config.user.addString(...)
 *   // ...
 *   // required for setting up the config UI groups & descriptions
 *   // very important - if this is not called, you will not see the groups/descriptions
 *   config.user.finalize(); // will return exception if initData is unset!
 *
 *   //
 *   // config.ext: Externally configured settings
 *   //
 *   config.ext.setInitData(initData); // very important!
 *   config.ext.addPOJO('ext_config_pojo', objYourPOJO);
 *   // or shorter
 *   config.ext.setInitData(initData).addPOJO('ext_config_pojo', objYourPOJO);
 *   // unlike config.user.finalize(), the config.ext.finalize() is unnecessary
 *   // and will return exception if called
 * ```
 *
 * The order in which you call config.user and config.ext methods doesn't matter.
 *
 * Of course, you can do it all in your `OnInit()` method directly and the last example above
 * will also give you access to fullpath/path/isOSP variables via `getScriptPathVars()` method
 * as the simpler method.
 *
 *
 * # How to add new object types
 *
 * Object types supported by the configuration are not necessarily limited to JS object types,
 * one could easily extend the keys of the TYPES enum,
 * add the proper check to validation method and use the new type.
 *
 * ## Ugly alternative
 * You could do it by directly modifying the library file,
 * which would be the uglier method but it is possible.
 *
 * E.g. a phone number could be implemented by adding
 * ```typescript
 *   TYPE.phonenum = 'PHONENUM'
 * ```
 *
 * to the enum and in validation method adding a new branch:
 * ```typescript
 *   var rePN = /^\d{3}-[\d\-]+$/; // or whatever format you use
 *   return rePN.test(inputPhoneNum);
 * ```
 *
 * ## Smarter alternative
 *
 * However, the library file does not have to be changed to extend the enum. One can do this:
 *
 * ```typescript
 * // add this in your calling .ts file
 *
 * namespace config {
 *     export enum TYPE {
 *         PHONENUM = 'PHONENUM'
 *     }
 *     const isValidOrig = user.isValid;
 *     user.isValid = function (val: any, type: config.TYPE) {
 *         switch(type) {
 *             case config.TYPE.PHONENUM:
 *                 DOpus.output('running extended method');
 *                 var rePN = /^\d{3}-[\d\-]+$/; // or whatever format you use
 *                 return rePN.test(val);
 *             default:
 *                 return isValidOrig(val, type);
 *         }
 *     }
 * }
 * ```
 *
 * Now you can directly use the existing types plus the new one:
 *
 * ```typescript
 * DOpus.output(config.user.isValid('123-456', config.TYPE.PHONENUM).toString());
 * DOpus.output(config.user.isValid('123-456', config.TYPE.STRING).toString());
 * ```
 *
 * # Important
 *
 * Do not try to display any dialog during DOpus startup and until OnInit() finishes,
 * in case your initialization routine causes an error, your script might fail to initialize,
 * i.e. no such shenanigans:
 *
 * ```typescript
 * config.setErrorMode(config.error.DIALOG);
 * config.addSimple('i', false, config.type.NUMBER, false);
 * ```
 */
namespace config {
    const myName = 'config';

    /**
     * Only supported object types supported are:
     *
     *  * primitive JS types: boolean, number, string -- NO objects, arrays, functions
     *  * DOpus types like DOpusMap, DOpusVector, DOpusItem, etc.
     *
     * Regexp's and POJOs are stored in JSON-ified form and parsed on request.
     *
     * This is due to the fact that DOpus user scripts are stateless.
     *
     * Script.vars & DOpus.vars allow putting objects, arrays & functions,
     * but after a script finishes, most likely DOpus or WSH cleans up the references
     * to these objects, and since they're no more used you will not get back
     * the objects from Script.Vars or DOpus.Vars.
     * Both .Vars seem to remember only primitive JS-types and own DOpus types,
     * between 2 consequtive runs.
     *
     * When a script is unloaded can be seen via DOpus advanced setting:
     *  script_output_level = All
     *
     * DOpus.vars might work, but it'd be a shame if a script would
     * pollute the global, persisted
     */
    export enum TYPE {
        BOOLEAN  = 'BOOLEAN',
        STRING   = 'STRING',
        NUMBER   = 'NUMBER',
        PATH     = 'PATH',
        ARRAY    = 'ARRAY',
        POJO     = 'POJO',
        DROPDOWN = 'DROPDOWN',
        REGEXP   = 'REGEXP',
        JSON     = 'JSON',
    }

    export type ConfigValue = {
        /** this is the JS variable and UI name shown in the script config screen, e.g. FORCE_REFRESH_AFTER_UPDATE */
        key: string;
        /** one of the supported types */
        type: config.TYPE,
        /** current internal (JS/TS) value of the config variable */
        val: any,
        /** default internal (JS/TS) value of the config variable */
        default: any,
        /** the group in the script config screen */
        group?: string,
        /** this is the description shown in the script config screen */
        desc?: string
    }
    type ConfigItems = {
        [key: string]: ConfigValue
    }

    const MEMORY_VAR_NAME: string = 'SCRIPT_CONFIG_DUMP';

    class Base implements ILibrary<Base> {
        myName: string = 'Base';

        private initData: DOpusScriptInitData | undefined;
        private items: ConfigItems = {};
        private cntItems: number = 0;
        protected logger: ILogger = libLogger.current;

        constructor() {
            DOpus.output('Base Constructor called');
        }

        // interface implementation
        setLogger(newLogger?: ILogger): this {
            this.logger = newLogger || this.logger;
            return this;
        }

        /**
         * This method should be called before adding any parameters the config.
         * @param {DOpusScriptInitData} initData got from DOpus OnInit() method
         * @returns this, for method chaining
         */
        setInitData(initData: DOpusScriptInitData): this {
            this.initData = initData;
            return this;
        }

        /**
         * @param {string} key config key
         * @param {config.TYPE} type value type
         * @param {any} val value
         * @param {string=''} group group name on the configuration screen
         * @param {string=''} desc description at the bottom of the configuration screen
         * @param {boolean=false} bypassValidation bypass validation
         * @param {boolean=true} bindToUI if the value should be bound to UI
         */
        addValue(key: string, type: config.TYPE, val: any, group = '', desc = '', bypassValidation = false) : IResult<true, IException<ex>> {
            const fname = this.addValue.fname = myName + '.addValue';

            if (typeof this.initData === 'undefined') {
                return Exc(ex.Uninitialized, fname, 'InitData has not been set yet, call setInitData() in your OnInit() first').show();
            }
            if (this.items.hasOwnProperty(key)) {
                return Exc(ex.KeyAlreadyExists, fname, key+' already exists').show();
            }
            if (!bypassValidation && !this.isValid(val, type)) {
                return Exc(ex.InvalidParameterValue, fname, 'type ' + type + ' does not accept given value ' + val).show();
            }
            this.cntItems++;
            this.items[key] = <ConfigValue>{ type: type, val: val, default: val, group: group, desc: desc };
            return g.ResultOk(true);
        }

        /**
         * Assigns the variables to their respective groups and assigns the descriptions to them.
         *
         * setInitData() method **must** have been called before calling this method.
         * @see {config.setInitData}
         */
        finalize(): IResult<true, IException<ex>> {
            const fname = this.finalize.fname = myName + '.finalize';

            if (typeof this.initData === 'undefined') {
                return Exc(ex.Uninitialized, fname, 'InitData has not been set yet, call setInitData() in your OnInit() first').show();
            }
            var config_groups = this.initData.config_groups || DOpus.create().map();
            var config_desc   = this.initData.config_desc   || DOpus.create().map();

            for (const key in this.items) {
                const val:ConfigValue = this.items[key];
                this.logger.snormal(
                    'FINALIZE -- key: %s, type: %s, val: %s, default: %s, group: %s, desc: %s',
                    key,
                    val.type,
                    val.type !== TYPE.DROPDOWN ? val.val.toString().slice(0, 20) + '...' : 'Vector',
                    ''|| (val.type !== TYPE.DROPDOWN ? val.default.toString().slice(0, 20) + '...' : 'Vector Default'),
                    val.group,
                    val.desc
                );

                switch(val.type) {
                    case TYPE.JSON:
                        this.initData.config[key] = JSON.stringify(val.val, null, 2).replace(/\n/mg, "\r\n");
                        break;
                    case TYPE.ARRAY:
                    case TYPE.POJO:
                        this.initData.config[key] = JSON.stringify(val.val, null, 2).replace(/\n/mg, "\r\n");
                        break;
                    case TYPE.DROPDOWN:
                        this.initData.config[key] = val.val;
                        break;
                    case TYPE.REGEXP:
                        this.initData.config[key] = val.val.toString();
                        break;
                    default:
                        this.initData.config[key] = val.val;
                };
                // this.initData.config[key] = val.type === TYPE.JSON ? JSON.stringify(val.val, null, 4).replace(/\n/mg, "\r\n") : val.val;
                config_groups.set(key, val.group||'');
                config_desc.set(key, val.desc||'');
            }
            this.initData.vars.set(MEMORY_VAR_NAME, JSON.stringify(this.items, null, 4));
            this.initData.config_groups = config_groups;
            this.initData.config_desc   = config_desc;
            return g.ResultOk(true);
        }

        /**
         * @param {any} val config value - uses the type set by addXXX-methods
         * @param {config.TYPE} type - use config.types
         * @returns {boolean} true if value conforms to given type
         */
        isValid(val: any, type: TYPE): boolean {
            switch (type) {
                case TYPE.BOOLEAN:
                    return typeof val === 'boolean';
                case TYPE.STRING:
                    return typeof val === 'string';
                case TYPE.NUMBER:
                    return typeof val === 'number';
                case TYPE.PATH:
                    return typeof val === 'string' && DOpus.fsUtil().exists(''+DOpus.fsUtil().resolve(val));
                case TYPE.ARRAY:
                    return typeof val === 'object' && Object.prototype.toString.call(val) === '[object Array]';
                case TYPE.POJO:
                    // any object without functions
                    if (typeof val !== 'object') {
                        return false;
                    }
                    for (var k in val) {
                        if (typeof val[k] === 'function') { return false; }
                    }
                    return true;
                case TYPE.DROPDOWN:
                    // must be DOpus Vector
                    if (typeof val !== 'object') {
                        return false;
                    }
                    try {
                        var dv: DOpusVector<number>;
                        dv = DOpus.create().vector(val);
                        if (dv.length < 2) {
                            return false;
                        }
                        return typeof dv[0] === 'number' && typeof dv[1] === 'string';
                    } catch (e) {
                        return false;
                     }
                case TYPE.REGEXP:
                    if (typeof val !== 'string') {
                        return false;
                    }
                    try { eval('new RegExp(' + val + ');'); return true; } catch (e) { return false }
                case TYPE.JSON:
                    if (typeof val !== 'string') {
                        return false;
                    }
                    try { JSON.parse(val); return true; } catch (e) { return false; }
                default:
                    g.showMessageDialog(null, 'isValid(): ' + type + ' is not supported');
                    return false;
            }
        }

        /**
         * auto-checks the current Script.config value this key is bound to
         * and returns the current value if valid and default value if invalid
         * @param {string} key config key
         * @param {boolean=true} autoGetDOpusValue get the Script.config value automatically, use false to get stored value
         * @returns {any} config value
         */
        getValue(key: string, autoGetDOpusValue = true): IResult<any, IException<ex>> {
            const fname = this.getValue.fname = this.myName + '.getValue';

            if (!this.items || !this.cntItems) {
                logger.force('Attempting to read from script memory, count: ' + this.cntItems);
                if (Script.vars.exists(MEMORY_VAR_NAME)) {
                    logger.force('Config dump found in memory');
                    this.items = JSON.parse(Script.vars.get(MEMORY_VAR_NAME));
                    logger.force(JSON.stringify(this.items).slice(0, 1000));
                    // logger.force(JSON.stringify(this.items, null, 4));
                } else {
                    logger.force('Config dump not found in memory');
                }
            }

            var usingConfigVal = false;
            if (!this.items.hasOwnProperty(key)) {
                DOpus.output('this.items:\n' + JSON.stringify(this.items, null, 4));
                return Exc(ex.InvalidKey, this.getValue, key + ' does not exist');
            }

            var valueToProbe;
            // if (autoGetDOpusValue && typeof Script.config !== 'undefined' && typeof Script.config[this.items[key].binding] !== 'undefined') {
            if (autoGetDOpusValue && typeof Script.config !== 'undefined' && typeof this.items[key].key !== 'undefined') {
                valueToProbe = Script.config[<string>this.items[key].key];
                if (typeof valueToProbe === 'undefined' || valueToProbe === null) {
                    return Exc(ex.InvalidParameterValue, this.getValue, 'Script config has no value for ' + key);
                }
                valueToProbe = this.convert(valueToProbe, this.items[key].type);
                if (typeof valueToProbe === 'undefined') {
                    return Exc(ex.InvalidParameterValue, this.getValue, 'Config value ' + this.items[key].key + ' is not valid');
                }
                usingConfigVal = true;
            } else {
                valueToProbe = this.items[key].val;
            }
            logger.sinfo('%s -- valueToProbe: %s, key: %s, type: %s', 'Base.getValue()', g.dumpObject(valueToProbe), key, this.items[key].type);

            if (!this.isValid(valueToProbe, this.items[key].type)) {
                return Exc(ex.InvalidParameterValue, this.getValue, 'Invalid value!\n\nKey:\t' + (usingConfigVal ? this.items[key].key : key) + '\nValue:\t' + valueToProbe + '\nUsing:\t' + (usingConfigVal ? 'User Config' : 'Default'));
            }
            return g.ResultOk(valueToProbe);
        }

        convert(val: any, type: config.TYPE) {
            function safeConvertToRegexp(testString: string): RegExp | undefined {
                var res;
                if (typeof testString === 'string') {
                    try { res = eval('new RegExp(' + testString + ');') } catch (e) { }
                }
                return res;
            }
            function safeConvertToJSON(testString: string): Object | undefined {
                var res;
                if (typeof testString === 'string') {
                    try { res = JSON.parse(testString); } catch (e) { }
                }
                return res;
            }
            switch (type) {
                case TYPE.ARRAY:
                case TYPE.POJO: return safeConvertToJSON(val);
                case TYPE.REGEXP: return safeConvertToRegexp(val);
                case TYPE.PATH: return '' + DOpus.fsUtil().resolve(val);
                default: return val;
            }
        }
        /**
         * @param {string} key config key
         * @returns {IResult<config.TYPE, IException<ex>>} type of value
         */
        getType(key: string): IResult<config.TYPE, IException<ex>> {
            if (!this.items[key]) {
                return Exc(ex.InvalidKey, this.getType, key + ' does not exist').show();
            }
            return g.ResultOk(this.items[key].type);
        }
        /**
         * @param {string} key config key
         * @param {any} val config value
         */
        setValue(key: string, val: any): IResult<any, IException<ex>> {
            if (!this.items.hasOwnProperty(key)) {
                return Exc(ex.InvalidKey, this.getType, key + ' does not exist').show();
            }
            if (!this.isValid(val, this.items[key].type)) {
                return Exc(ex.InvalidParameterType, this.setValue, key + ' must have type ' + this.items[key].type + ', given: ' + typeof val).show();
            }
            this.items[key].val = val;
            return g.ResultOk();
        }

        /** @returns {string} stringified config */
        toString(): string {
            var vals: { [k: string]: any } = {};
            for (var k in this.items) vals[k] = this.items[k].val;
            return JSON.stringify(vals, null, 4);
        }


        // serialize(val: any, type: config.TYPE): IResult<string, IException<ex>> {
        //     // TODO
        // }

        // deserialize(key: string): IResult<any, IException<ex>> {
        //     // TODO
        // }

        // /**
        //  * @param {string} key config key
        //  * @returns {boolean} true if key is valid
        //  */
        // hasKey(key: string): boolean {
        //     return this.items.hasOwnProperty(key);
        // }
        // /** @returns {number} number of elements in the config */
        // getCount(): number {
        //     return this.cntItems;
        // }
        /** @returns {string[]} keys in the config */
        getKeys(): string[] {
            return Object.keys(this.items);
        }

    }


    // not public, access via singleton below
    class User extends Base {
        constructor() {
            super();
            this.myName = myName + '.User';
        }
    }


    // not public, access via singleton below
    class ScriptExt extends Base {
        constructor() {
            super();
            this.myName = myName + '.ScriptExt';
        }
        addPOJO(key: string, val: string) {
            // note there is no group, desc necessary for this method
            return super.addValue(key, config.TYPE.POJO, val);
        }
        addPOJOFromFile(key: string, filepath: string) {
            // the messages in this method are crucial for script initialization
            // therefore they ignore the logger level by using 'force' methods
            var msg: string,
                parsed: string;
            if (!DOpus.fsUtil().exists(filepath)) {
                msg = 'Skipping external config, not found: ' + filepath;
                // super.showError(msg);
                return g.ResultErr(msg).show();
            }
            this.logger.force('Using external config: ' + filepath);

            var resReadFile = fs.readFile(filepath);
            if (resReadFile.isErr()) {
                // super.showError(resReadFile.err);
                return g.ResultErr(resReadFile).show();
            }
            this.logger.verbose('external config contents:\n' + resReadFile.ok);

            // test parseability
            try {
                parsed = JSON.parse(resReadFile.ok);
                this.logger.normal('...external config is valid JSON');
            } catch(e) {
                msg = 'External config exists but is not valid JSON, ignoring\n\nerror: ' + e.toString() + '\nfile: ' + filepath;
                // super.showError(msg);
                return g.ResultErr(msg).show();
            }

            return super.addValue(key, config.TYPE.POJO, parsed);
        }
        finalize(): IResult<true, IException<ex>> {
            return Exc(ex.Uninitialized, 'Base.addValue', 'InitData has not been set yet, call setInitData() in your OnInit() first');
        }

    }


    /** Singleton access to user configurable parameters i.e. via DOpus settings screen. */
    export const user = new User();

    /** Singleton access to external configuration, i.e. JSON-based config files accessible during script initialization. */
    export const ext = new ScriptExt();

}
