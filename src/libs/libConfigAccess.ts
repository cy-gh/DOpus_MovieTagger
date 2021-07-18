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

    /** helps to formalize the access to DOpusMap fields via known fields */
    enum MetaField {
        /** this is the JS variable and UI name shown in the script config screen, e.g. FORCE_REFRESH_AFTER_UPDATE */
        KEY     = 'KEY',
        /** one of the supported types, should be one of `config.TYPE` */
        TYPE    = 'TYPE',
        // /** current internal (JS/TS) value of the config variable */
        // VAL     = 'VAL',
        /** default internal (JS/TS) value of the config variable */
        DEFAULT = 'DEFAULT',
        /** the group in the script config screen */
        GROUP   = 'GROUP',
        /** this is the description shown in the script config screen */
        DESC    = 'DESC',
        /** if the item should be hidden on the UI, i.e. not added at all */
        HIDE    = 'HIDE',
    }

    const CONFIG_KEYS_META_MAP_NAME: string = 'CONFIG_KEYS_META';

    class Base implements ILibrary<Base> {
        myName: string = 'Base';

        private initData: DOpusScriptInitData | undefined;
        protected logger: ILogger = libLogger.current;

        constructor(initData?: DOpusScriptInitData) {
            DOpus.output('Base Constructor called');
            if (initData) {
                this.initData = initData;
                this.initData.vars.set(CONFIG_KEYS_META_MAP_NAME, DOpus.create().map()); // initialize memory map
            }
        }

        /** helps to formalize the access to DOpusMap fields via known fields */
        createItemMeta(key: string, type: config.TYPE, def?: any, group = '', desc = '', hide = false):DOpusMap {
            var map = DOpus.create().map();
            map.set(MetaField.KEY,       key);
            map.set(MetaField.TYPE,      type);
            map.set(MetaField.DEFAULT,   def);
            map.set(MetaField.GROUP,     group);
            map.set(MetaField.DESC,      desc);
            map.set(MetaField.HIDE,      hide);
            return map;
        }

        // interface implementation
        setLogger(newLogger?: ILogger): this {
            this.logger = newLogger || this.logger;
            return this;
        }

        /** gives access to actual configuration values */
        private getConfig(): DOpusScriptConfig {
            return g.isInitializing() && this.initData && this.initData.config
                ? this.initData.config
                : Script.config
        }

        /** gives access to key meta information for all known keys */
        private getConfigKeysMetaMap(): DOpusVars {
            return g.isInitializing() && this.initData && this.initData.vars
                ? this.initData.vars.get(CONFIG_KEYS_META_MAP_NAME)
                : Script.vars.get(CONFIG_KEYS_META_MAP_NAME);
        }

        /** returns the meta information for a single key */
        private getConfigKeyMeta(key: string): DOpusMap {
            return this.getConfigKeysMetaMap().get(key);
        }

        /** serializes given value to string, so that it can be stored in memory */
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
                // do not show resolved values in UI // case TYPE.PATH: return '' + DOpus.fsUtil().resolve(val);
                default: return val;
            }
        }

        /** deserializes string to its proper type */
        private deserialize(val: any, type: config.TYPE): any {
            function safeConvertToRegexp(testString: string): RegExp | undefined {
                try { return eval('new RegExp(' + testString + ');') } catch (e) { }
            }
            function safeConvertToObject(testString: string): Object | undefined {
                try { return JSON.parse(testString); } catch (e) { }
            }
            switch (type) {
                case TYPE.ARRAY:
                case TYPE.POJO:     return safeConvertToObject(val);
                case TYPE.REGEXP:   return safeConvertToRegexp(val);
                case TYPE.DROPDOWN: return typeof val === 'number' ? val : (val as unknown as DOpusVector<string>)[0]; // only required for default value
                default:            return val;
            }
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
        addValue(key: string, type: config.TYPE, val: any, group = '', desc = '', hide = false, bypassValidation = false) : IResult<true, IException<ex>> {
            const fname = this.addValue.fname = nsName + '.addValue';

            const keysMetaMap = this.getConfigKeysMetaMap();
            if (!g.isInitializing()) {
                return Exc(ex.DeveloperStupidity, fname, 'This method cannot be called outside OnInit() - key: ' + key).show();
            }
            if (keysMetaMap.exists(key)) {
                return Exc(ex.KeyAlreadyExists, fname, key+' already exists').show();
            }
            if (!bypassValidation && !this.isValid(val, type)) {
                return Exc(ex.InvalidParameterValue, fname, 'key: ' + key + ', type: ' + type + ' does not accept given value: ' + val).show();
            }
            // // convert dropdown vector to a number, because the index will be always a number
            // if (type === TYPE.DROPDOWN) {
            //     val = (<DOpusVector<any>>val)[0];
            //     type = TYPE.NUMBER;
            // }
            keysMetaMap.set(key, this.createItemMeta(key, type, this.serialize(val, type), group, desc, hide));
            return g.ResultOk(true);
        }


        /**
         * auto-checks the current Script.config value this key is bound to
         * and returns the current value if valid, and default value if invalid
         * @param {string} key config key
         * @param {boolean=true} autoGetDOpusValue get the Script.config value automatically, use false to get default value
         * @returns {any} config value
         */
        getValue(key: string, autoGetDOpusValue = true): IResult<any, IException<ex>> {
            const fname = this.getValue.fname = this.myName + '.getValue';
            if (!this.getConfigKeysMetaMap().exists(key)) {
                return g.ResultErr(Exc(ex.Uninitialized, fname, 'Value of ' + key + ' is not set yet')).show();
            }
            let currentUserValue = this.getConfig()[key];
            let keyMeta = this.getConfigKeyMeta(key);
            let retVal;

            if (this.isValid(currentUserValue, keyMeta.get(MetaField.TYPE))) {
                retVal = this.deserialize(currentUserValue, keyMeta.get(MetaField.TYPE));
                logger.sinfo('%s -- User value is valid, returning value: %s', fname, retVal);
            } else if (autoGetDOpusValue) {
                retVal = this.deserialize(keyMeta.get(MetaField.DEFAULT), keyMeta.get(MetaField.TYPE));
                logger.sinfo('%s -- User value is invalid, returning default: %s', fname, retVal);
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

            const keysMetaMap = this.getConfigKeysMetaMap();
            for (var e = new Enumerator(keysMetaMap); !e.atEnd(); e.moveNext()) {
                const key: string = e.item();
                const keyMeta = this.getConfigKeyMeta(key);

                this.logger.snormal(
                    'FINALIZE -- key: %s, type: %s, default: %s, group: %s, desc: %s',
                    key,
                    keyMeta.get(MetaField.TYPE),
                    (keyMeta.get(MetaField.TYPE) !== TYPE.DROPDOWN ? (''+this.serialize(keyMeta.get(MetaField.DEFAULT), keyMeta.get(MetaField.TYPE))).slice(0, 20) : 'Vector Default'),
                    keyMeta.get(MetaField.GROUP),
                    keyMeta.get(MetaField.DESC).replace(/\r|\n/g, ' ')
                );
                // do not add hidden fields to UI
                if (keyMeta.get(MetaField.HIDE)) {
                    this.logger.swarn('Skipping hidden field: ' + key);
                    continue;
                }
                this.initData.config[key] = keyMeta.get(MetaField.DEFAULT); // set the default value shown in UI
                config_groups.set(key, keyMeta.get(MetaField.GROUP)||'');
                config_desc.set(key, keyMeta.get(MetaField.DESC)||'');
            }
            this.initData.config_groups = config_groups;
            this.initData.config_desc   = config_desc;
            return g.ResultOk(true);
        }



        /**
         * @param {any} val value
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
                    if (typeof val === 'number') {
                        // numbers (selected index) in dropdowns are always valid!
                        return true;
                    } else if (!g.isValidDOVector(val)) {
                        // if not number then it must be DOpus Vector
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
                    if (typeof val === 'object' && Object.prototype.toString.call(val) === '[object RegExp]') {
                        return true;
                    } else if (typeof val !== 'string') {
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

        /** checks all current values, returns true if all are valid, and list of invalid keys if not  */
        isUserConfigValid(): IResult<true, string[]> {
            const fname = this.isUserConfigValid.fname = nsName + '.isUserConfigValid';

            let invalidKeys: string[] = [];
            for (let e = new Enumerator(this.getConfigKeysMetaMap()); !e.atEnd(); e.moveNext()) {
                const key = e.item();
                const keyMeta = this.getConfigKeyMeta(key);
                if (keyMeta.get(MetaField.TYPE) === TYPE.DROPDOWN) {
                    continue; // dropdowns are always valid, because they cannot be freely-changed
                }
                // hidden values cannot be accessed via this.getConfig()[key]
                let currentValue;
                if (keyMeta.get(MetaField.HIDE)) {
                    currentValue = this.getValue(key, keyMeta.get(MetaField.TYPE)).ok;
                } else {
                    currentValue = this.deserialize( this.getConfig()[key], keyMeta.get(MetaField.TYPE));
                }
                if ( !this.isValid( currentValue, keyMeta.get(MetaField.TYPE) ) ) {
                    logger.swarn('%s -- ', fname, ('key: ' + key + ', raw val: ' + this.getConfig()[key] + ', typeof deserialize currentValue: ' + typeof currentValue + ', expected: ' + keyMeta.get(MetaField.TYPE)));
                    invalidKeys.push(key);
                }
            }
            if (invalidKeys.length) {
                return g.ResultErr(invalidKeys);
            } else {
                return g.ResultOk(true);
            }
        }

        /** @returns {string} stringified config */
        toString(): string {
            let vals: { [k: string]: any } = {};
            for (let e = new Enumerator(this.getConfigKeysMetaMap()); !e.atEnd(); e.moveNext()) {
                const key = e.item();
                const keyMeta = this.getConfigKeyMeta(key);
                // get the current value, and deserialize it using its type
                vals[key] = this.deserialize(this.getConfig()[key], keyMeta.get(MetaField.TYPE));
            }
            // and now serialize it as a whole -- not the most elegant solution, but eh..
            return JSON.stringify(vals, null, 4);
        }

        /** @returns {string[]} keys in the config */
        getKeys(): string[] {
            let keys: string[] = [];
            for (let e = new Enumerator(this.getConfigKeysMetaMap()); !e.atEnd(); e.moveNext()) {
                keys.push(e.item());
            }
            return keys;
        }
    }

    /**
     *
     *
     *
     *
     *
     * ************************************************************************************************************************
     *
     *
     *
     *
     *
     *
     */


    // not public, access via singleton below
    export class User extends Base {
        private static instance: User;
        private constructor(initData?: DOpusScriptInitData) {
            super(initData);
            this.myName = nsName + '.User';
            User.instance = this;
        }
        static getInstance(initData?: DOpusScriptInitData): User {
            const fname = User.getInstance.fname = nsName + '.User.getInstance';
            logger.sinfo('%s -- Getting instance, singleton exists: %t', fname, User.instance ? true : false);
            // the singleton can be accessed only during repeated runs of the script
            // e.g. while accessing a folder when columns are requested for multiple files.
            // but as soon as the script gets unloaded, the singleton will be garbage-collected,
            // and a new instance will be created instead.
            return User.instance || new User(initData);
        }
    }

    /**
     *
     *
     *
     *
     *
     * ************************************************************************************************************************
     *
     *
     *
     *
     *
     *
     */

    // not public, access via singleton below
    export class ScriptExt extends Base {
        private static instance: ScriptExt;
        private constructor(initData?: DOpusScriptInitData) {
            super(initData);
            this.myName = nsName + '.ScriptExt';
            ScriptExt.instance = this;
        }
        static getInstance(initData?: DOpusScriptInitData): ScriptExt {
            const fname = ScriptExt.getInstance.fname = nsName + '.ScriptExt.getInstance';
            logger.sinfo('%s -- Getting instance, singleton exists: %b', fname, !!ScriptExt.instance);
            return ScriptExt.instance || new ScriptExt(initData);
        }

        getPOJOFromFile<T>(key: string, filepath: string): IResult<T, IException<ex>> {
            const fname = this.getPOJOFromFile.fname = this.myName + '.getPOJOFromFile';
            // the messages in this method are crucial for script initialization
            // therefore they ignore the logger level by using 'force' methods
            if (!DOpus.fsUtil().exists(filepath)) {
                this.logger.force('Skipping external config, not found: ' + filepath);
                return g.ResultOk({});
            }
            this.logger.force('Using external config: ' + filepath);

            var resReadFile = fs.readFile(filepath);
            if (resReadFile.isErr()) {
                return g.ResultErr(Exc(ex.FileRead, fname, resReadFile.err)).show();
            }
            this.logger.verbose('external config contents:\n' + resReadFile.ok);

            // test parseability
            let parsed: T;
            try {
                parsed = JSON.parse(resReadFile.ok);
                this.logger.normal('...external config is valid JSON');
            } catch(e) {
                return g.ResultErr(Exc(ex.FileRead, fname, 'External config exists but is invalid JSON, ignoring file\n\nerror: ' + e.toString() + '\nfile: ' + filepath)).show();
            }
            var addRes = super.addValue(key, config.TYPE.POJO, parsed, '', '', true, false);
            if (addRes.isErr()) {
                return g.ResultErr(addRes.err).show();
            }
            return g.ResultOk(parsed);
        }

    }

}
