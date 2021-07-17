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
    const nsName = 'config';

    /**
     * Supported object types:
     *
     *  * primitive JS types: boolean, number, string
     *  * JSON-ifiable JS types: POJOs (simple objects without functions), regexp's
     *  * DOpus types like DOpusMap, DOpusVector, DOpusItem, etc.
     *
     * **CAUTION:** Complex objects (i.e. with functions), arrays, functions are **not** supported.
     *
     * POJO's and Regexp's are serialized/deserialized automatically on request.
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
     * `script_output_level = All`
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

    type ConfigItem = {
        // /** this is the JS variable and UI name shown in the script config screen, e.g. FORCE_REFRESH_AFTER_UPDATE */
        // key: string;
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

    enum ConfigItemFields {
        /** this is the JS variable and UI name shown in the script config screen, e.g. FORCE_REFRESH_AFTER_UPDATE */
        KEY     = 'KEY',
        /** one of the supported types */
        TYPE    = 'TYPE',
        /** current internal (JS/TS) value of the config variable */
        VAL     = 'VAL',
        /** default internal (JS/TS) value of the config variable */
        DEFAULT = 'DEFAULT',
        /** the group in the script config screen */
        GROUP   = 'GROUP',
        /** this is the description shown in the script config screen */
        DESC    = 'DESC',
        /** if the item should be hidden on the UI, i.e. not added at all */
        HIDE    = 'HIDE',
    }

    // interface DOpusMapExt extends DOpusMap {
    //     map: DOpusMap;
    // }
    // class ConfigItemNew implements DOpusMapExt {
    //     count: number;
    //     empty: boolean;
    //     length: number;
    //     size: number;
    //     map: DOpusMap;
    //     constructor (key: string, type: config.TYPE, val?: any, def?: any, group = '', desc = '') {
    //         var map = DOpus.create().map();
    //         map.set(ConfigItemFields.KEY,       key);
    //         map.set(ConfigItemFields.TYPE,      type);
    //         map.set(ConfigItemFields.VAL,       val);
    //         map.set(ConfigItemFields.DEFAULT,   def);
    //         map.set(ConfigItemFields.GROUP,     group);
    //         map.set(ConfigItemFields.DESC,      desc);
    //         this.count  = map.count;
    //         this.empty  = map.empty;
    //         this.length = map.length;
    //         this.size   = map.size;
    //         this.map    = map;
    //     }
    //     assign(from?: DOpusMap)                 { throw new Error("Method not implemented."); }
    //     clear()                                 { throw new Error("Method not implemented."); }
    //     erase(key?: any)                        { throw new Error("Method not implemented."); }
    //     merge(from?: DOpusMap)                  { throw new Error("Method not implemented."); }
    //     exists(key?: any): boolean              { return this.map.exists(key); }
    //     get(key: any)                           { return this.map.get(key); }
    //     set(key: ConfigItemFields, val: any)    { this.map.set(key, val); }
    // }

    const MEMORY_MAP_NAME: string = 'SCRIPT_CONFIG_DUMP';

    class Base implements ILibrary<Base> {
        myName: string = 'Base';

        private initData: DOpusScriptInitData | undefined;
        protected logger: ILogger = libLogger.current;

        constructor(initData?: DOpusScriptInitData) {
            DOpus.output('Base Constructor called');
            if (initData) {
                this.initData = initData;
                this.initData.vars.set(MEMORY_MAP_NAME, DOpus.create().map()); // initialize memory map
            }
        }

        createConfigItem(key: string, type: config.TYPE, val?: any, def?: any, group = '', desc = '', hide = false):DOpusMap {
            var map = DOpus.create().map();
            map.set(ConfigItemFields.KEY,       key);
            map.set(ConfigItemFields.TYPE,      type);
            map.set(ConfigItemFields.VAL,       val);
            map.set(ConfigItemFields.DEFAULT,   def);
            map.set(ConfigItemFields.GROUP,     group);
            map.set(ConfigItemFields.DESC,      desc);
            map.set(ConfigItemFields.HIDE,      hide);
            return map;
        }


        printMemMapSize() {
            // DOpus.output('Mem map length: ' + (<DOpusMap>this.initData.vars.get(MEMORY_MAP_NAME)).length);
        }

        // interface implementation
        setLogger(newLogger?: ILogger): this {
            this.logger = newLogger || this.logger;
            return this;
        }

        private getCache(): DOpusVars {
            return g.isInitializing() && this.initData && this.initData.vars
                ? this.initData.vars.get(MEMORY_MAP_NAME)
                : Script.vars.get(MEMORY_MAP_NAME);
        }
        private serialize(val: any, type: config.TYPE): string {
            function regexpToJSON(regexp: RegExp): string {
                // return '/' + regexp.source + '/' + regexp.flags; // does not work with JScript
                return regexp.toString();
            }
            function pojoToJSON(object: object): string {
                return typeof object === 'string' ? object : JSON.stringify(object, null, 2).replace(/\n/mg, "\r\n");
            }
            switch (type) {
                case TYPE.ARRAY:
                case TYPE.POJO: return pojoToJSON(val);
                case TYPE.REGEXP: return regexpToJSON(val);
                case TYPE.PATH: return '' + DOpus.fsUtil().resolve(val);
                default: return val;
            }
        }
        private deserialize(val: string, type: config.TYPE): any {
            function safeConvertToRegexp(testString: string): RegExp | undefined {
                try { return eval('new RegExp(' + testString + ');') } catch (e) { }
            }
            function safeConvertToObject(testString: string): Object | undefined {
                try { return JSON.parse(testString); } catch (e) { }
            }
            switch (type) {
                case TYPE.ARRAY:
                case TYPE.POJO: return safeConvertToObject(val);
                case TYPE.REGEXP: return safeConvertToRegexp(val);
                default: return val;
            }
        }


        // private dumpMemoryCache() {
        //     const cache = this.getCache();
        //     for (var e = new Enumerator(cache); !e.atEnd(); e.moveNext()) {
        //         var k = e.item();
        //         DOpus.output(k + ': --' + JSON.stringify(cache.get(k), null, 4).slice(0,50) + '--');
        //     }
        // }

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
            const fname = this.addValue.fname = nsName + '.addValue';

            const cache = this.getCache();
            if (!g.isInitializing()) {
                return Exc(ex.DeveloperStupidity, fname, 'This method cannot be called outside OnInit() - key: ' + key).show();
            }
            if (cache.exists(key)) {
                return Exc(ex.KeyAlreadyExists, fname, key+' already exists').show();
            }
            if (!bypassValidation && !this.isValid(val, type)) {
                return Exc(ex.InvalidParameterValue, fname, 'key: ' + key + ', type: ' + type + ' does not accept given value: ' + val).show();
            }
            DOpus.output('Mem map length: ' + (<DOpusMap>this.initData.vars.get(MEMORY_MAP_NAME)).length);
            this.getCache().set(key, JSON.stringify(<ConfigItem>{ type: type, val: this.serialize(val, type), default: this.serialize(val, type), group: group, desc: desc }));
            return g.ResultOk(true);
        }

        /**
         * auto-checks the current Script.config value this key is bound to
         * and returns the current value if valid and default value if invalid
         * @param {string} key config key
         * @param {boolean=true} autoGetDOpusValue get the Script.config value automatically, use false to get default value
         * @returns {any} config value
         */
        getValue(key: string, autoGetDOpusValue = true): IResult<any, IException<ex>> {
            const fname = this.getValue.fname = this.myName + '.getValue';

            DOpus.output('isInitializing: ' + g.isInitializing());

            if (!this.getCache().exists(key)) {
                return g.ResultErr(Exc(ex.Uninitialized, fname, 'Value of ' + key + ' is not set yet')).show();
            }


            let cfgItem: ConfigItem = JSON.parse(this.getCache().get(key));
            let retVal;
            if (this.isValid(cfgItem.val, cfgItem.type)) {
                retVal = this.deserialize(cfgItem.val, cfgItem.type);
            } else if (autoGetDOpusValue) {
                retVal = this.deserialize(cfgItem.default, cfgItem.type);
            }

            return g.ResultOk(retVal);
        }


        /**
         * Assigns the variables to their respective groups and assigns the descriptions to them.
         *
         * setInitData() method **must** have been called before calling this method.
         * @see {config.setInitData}
         */
        finalize(): IResult<true, IException<ex>> {
            const fname = this.finalize.fname = nsName + '.finalize';

            if (typeof this.initData === 'undefined') {
                return Exc(ex.Uninitialized, fname, 'InitData has not been set yet, it must be passed from your OnInit() first').show();
            }
            var config_groups = this.initData.config_groups || DOpus.create().map();
            var config_desc   = this.initData.config_desc   || DOpus.create().map();

            // for (const key in this.items) {
            //     const val:ConfigItem = this.items[key];
            const cache = this.getCache();
            for (var e = new Enumerator(cache); !e.atEnd(); e.moveNext()) {
                const key:string = e.item();
                const val:ConfigItem = JSON.parse(cache.get(key));

                this.logger.sforce(
                    'FINALIZE -- key: %s, type: %s, val: %s, default: %s, group: %s, desc: %s',
                    key,
                    val.type,
                    val.type !== TYPE.DROPDOWN ? val.val.toString().slice(0, 20) + '...' : 'Vector',
                    ''|| (val.type !== TYPE.DROPDOWN ? val.default.toString().slice(0, 20) + '...' : 'Vector Default'),
                    val.group,
                    val.desc
                );

                this.initData.config[key] = val.val;
                // this.initData.config[key] = val.type === TYPE.JSON ? JSON.stringify(val.val, null, 4).replace(/\n/mg, "\r\n") : val.val;
                config_groups.set(key, val.group||'');
                config_desc.set(key, val.desc||'');
            }
            // this.initData.vars.set(MEMORY_VAR_NAME, JSON.stringify(this.items, null, 4));
            this.initData.config_groups = config_groups;
            this.initData.config_desc   = config_desc;
            return g.ResultOk(true);
        }


        isUserConfigValid(): IResult<true, string[]> {
            for(const key in this.getKeys()) {
            }
            return g.ResultOk(true);
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
         * @param {any} val config value
         */
        setValue(key: string, val: any): IResult<any, IException<ex>> {
            const cache = this.getCache();

            // if (!this.items.hasOwnProperty(key)) {
            if (!cache.exists(key)) {
                return Exc(ex.InvalidKey, this.setValue, key + ' does not exist').show();
            }
            var configItem: ConfigItem = JSON.parse(cache.get(key));
            if (!this.isValid(val, configItem.type)) {
                return Exc(ex.InvalidParameterType, this.setValue, key + ' must have type ' + configItem.type + ', given: ' + typeof val).show();
            }
            // this.items[key].val = val;
            configItem.val = val;
            cache.set(key, JSON.stringify(configItem));
            return g.ResultOk();
        }


        /**
         * @param {any} val config value - uses the type set by addXXX-methods
         * @param {config.TYPE} type - use config.types
         * @returns {boolean} true if value conforms to given type
         */
        isValid(val: any, type: TYPE): boolean {
            switch (type) {
                case TYPE.BOOLEAN:  return typeof val === 'boolean';
                case TYPE.STRING:   return typeof val === 'string';
                case TYPE.NUMBER:   return typeof val === 'number';
                case TYPE.PATH:     return typeof val === 'string' && DOpus.fsUtil().exists(''+DOpus.fsUtil().resolve(val));
                case TYPE.ARRAY:    return typeof val === 'object' && Object.prototype.toString.call(val) === '[object Array]';
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

        /** @returns {string} stringified config */
        toString(): string {
            var vals: { [k: string]: any } = {};
            var cache = this.getCache();
            for (var e = new Enumerator(cache); !e.atEnd(); e.moveNext()) {
                var k = e.item();
                vals[k] = JSON.parse(cache.get(k));
            }
            return JSON.stringify(vals, null, 4);
            // var vals: { [k: string]: any } = {};
            // for (var k in this.items) vals[k] = this.items[k].val;
            // return JSON.stringify(vals, null, 4);
        }

        /** @returns {string[]} keys in the config */
        getKeys(): string[] {
            var keys: string[] = [];
            var cache = this.getCache();
            for (var e = new Enumerator(cache); !e.atEnd(); e.moveNext()) {
                var k = e.item();
                keys.push(k);
            }
            return keys;
            // return Object.keys(this.items);
        }

        // /**
        //  * @param {string} key config key
        //  * @returns {IResult<config.TYPE, IException<ex>>} type of value
        //  */
        //  getType(key: string): IResult<config.TYPE, IException<ex>> {
        //     if (!this.items[key]) {
        //         return Exc(ex.InvalidKey, this.getType, key + ' does not exist').show();
        //     }
        //     return g.ResultOk(this.items[key].type);
        // }

    }


    // not public, access via singleton below
    export class User extends Base {
        private static instance: User;
        private constructor(initData?: DOpusScriptInitData) {
            super(initData);
            this.myName = nsName + '.User';
            User.instance = this;
        }
        // @ts-ignore
        static getInstance(initData?: DOpusScriptInitData): User {
            if (User.instance) {
                return User.instance;
            // } else if (initData) {
            } else {
                return new User(initData);
            }
            g.abortWith(Exc(ex.DeveloperStupidity, 'User.getInstance', 'You cannot call this method without initData during OnInit()').err);
        }
    }


    // not public, access via singleton below
    export class ScriptExt extends Base {
        private static instance: ScriptExt;
        private constructor(initData?: DOpusScriptInitData) {
            super(initData);
            this.myName = nsName + '.ScriptExt';
            ScriptExt.instance = this;
        }
        // @ts-ignore
        static getInstance(initData?: DOpusScriptInitData): ScriptExt {
            // return ScriptExt.instance || new ScriptExt(initData);
            if (ScriptExt.instance) {
                return ScriptExt.instance;
            // } else if (initData) {
            } else {
                return new ScriptExt(initData);
            }
            g.abortWith(Exc(ex.DeveloperStupidity, 'ScriptExt.getInstance', 'You cannot call this method without initData during OnInit()').err);
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


    // export function getInstance(type: User|ScriptExt) {
    //     if (type === User) {
    //         return User.get
    //     }
    // }


    // /** Singleton access to user configurable parameters i.e. via DOpus settings screen. */
    // export const user = new User();

    /** Singleton access to external configuration, i.e. JSON-based config files accessible during script initialization. */
    // export const ext = new ScriptExt();

}
