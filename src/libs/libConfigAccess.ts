///<reference path='../std/libStdDev.ts' />
///<reference path='./formatters.ts' />
///<reference path='./libDOpusHelper.ts' />
///<reference path='./libExceptions.ts' />


/**
 * # What is it?
 *
 * This library makes access to configuration variables easier,
 * by unifying the reading, writing and validating of user variables
 * against each assigned type to a specific variable.
 *
 * For example, if you set up a variable as JSON or REGEXP,
 * it will be automatically validated after a user change.
 * If the new user input is invalid, the default value from the script will be used.
 * This has the advantage that a typo does not make the script dump.
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
 * call either addValue() or store the entire JSON by calling the config.ext.addPOJO() method
 * and can immediately use the variable(s) in `OnInit()`, or later of course.
 *
 * Variables added to config.ext will **not** visible in DOpus UI, as explained above.
 *
 *
 * # How to use:
 *
 * First define a unique, constant, global ID for your script,
 * to set the memory variable with your script's name & path
 * which are available only during `OnInit()`.
 *
 * ```typescript
 *   // on top level
 *   const GLOBAL_SCRIPT_ID = 'MyAwesomeScript';
 * ```
 *
 *
 * Then, decide on which of the following 2 you want to use:
 *
 *
 * * If you want to use only the script fullpath/path/isOSP variables,
 * e.g. in order to extract WAV files from your OSP
 * or to read an external configuration JSON from the same dir as the script,
 * call one or both in your `OnInit()` and you can call
 * `config.user.getScriptPathVars()` or `config.ext.getScriptPathVars()`
 * and get the fullpath/path/isOSP information.
 *
 * ```typescript
 *   config.user.setInitData(GLOBAL_SCRIPT_ID, initData);
 *   config.ext.setInitData(GLOBAL_SCRIPT_ID, initData);
 * ```
 * Now you can call `config.user.getScriptPathVars(GLOBAL_SCRIPT_ID)` or `config.ext.getScriptPathVars(GLOBAL_SCRIPT_ID)`
 * and get the fullpath/path/isOSP information.
 *
 *
 *
 * * If you want to use more than just fullpath/path/isOSP variables,
 * but also variables which are user-configurable via DOpus Scripts UI,
 * write any function callable during `OnInit()`, e.g.
 * ```typescript
 *   function setupConfigVars(uniqueID: string, initData: DOpusScriptInitData) {
 *     // Top level function.
 *     // More to this below.
 *   }
 * ```
 *
 * in OnInit() call it with the scriptInitData you get automatically from DOpus, e.g.
 * ```typescript
 *   setupConfigVars(uniqueID, initData);
 *   // note that this will also call config.user.setInitData(initData)
 * ```
 *
 * Your `setupConfigVars()` method should look like this
 * ```typescript
 *   //
 *   // config.user: UI-configured settings
 *   //
 *   config.user.setInitData(uniqueID, initData); // very important!
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
 *   config.ext.setInitData(uniqueID, initData); // very important!
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

    export enum TYPE {
        BOOLEAN  = 'BOOLEAN',
        STRING   = 'STRING',
        NUMBER   = 'NUMBER',
        PATH     = 'PATH',
        ARRAY    = 'ARRAY',
        POJO     = 'POJO',
        OBJECT   = 'OBJECT',
        REGEXP   = 'REGEXP',
        JSON     = 'JSON',
        FUNCTION = 'FUNCTION',
    }
    export enum ERROR_MODE {
        NONE     = 'NONE',
        ERROR    = 'ERROR',
        DIALOG   = 'DIALOG',
    }

    export type ConfigValue = {
        key: string;
        /** current internal (JS/TS) value of the config variable */
        val: any,
        /** default internal (JS/TS) value of the config variable */
        default: any,
        /** one of the supported types */
        type: config.TYPE,
        /** this is the name shown in the script config screen, e.g. FORCE_REFRESH_AFTER_UPDATE */
        binding?: string,
        /** the group in the script config screen */
        group?: string,
        /** this is the description shown in the script config screen */
        desc?: string,
    }
    type ConfigItems = {
        [key: string]: ConfigValue
    }

    class Base {

        private initData: DOpusScriptInitData | undefined;
        private items: ConfigItems = {};
        private cntItems = 0;
        private defaultErrorMode = ERROR_MODE.DIALOG;

        static globalVarSuffix: string = '_scriptFullPathAsDOpusItem';

        constructor() {
            this.setErrorMode(this.defaultErrorMode);
        }

        /**
         * This method should be called before adding any parameters the config.
         *
         * It also sets a global variable in the global DOpus memory with the fullpath of this script
         * so that we can determine if we are in development or released OSP mode.
         * @param {string} scriptID unique script ID, which will be used to store the script's fullpath from initData
         * @param {DOpusScriptInitData} initData got from DOpus OnInit() method
         * @returns this, for method chaining
         */
        setInitData(scriptID: string, initData: DOpusScriptInitData): this {
            this.initData = initData;
            doh.setGlobalVar(scriptID + Base.globalVarSuffix, doh.fsu.getItem(this.initData.file));
            return this;
        }

        /**
         * Reads the fullpath, path name and isOSP flag of this script.
         * The DOpusItem can be easily got with the fullpath and you have access to all other properties besides path.
         * @param {string} scriptID unique script ID, which will be used to retrieve the script's fullpath from initData
         */
        getScriptPathVars(scriptID: string): IResult<{ fullpath: string; path: string; isOSP: boolean; }, IException<ex.UninitializedException>> {
            const oThisScriptsPath:DOpusItem = doh.getGlobalVar(scriptID + Base.globalVarSuffix);

            if (!oThisScriptsPath) {
                return UserExc(ex.UninitializedException, 'Base.getScriptPathVars', 'InitData has not been set yet, call setInitData() in your OnInit() first');
            }
            return g.ResultOk({
                fullpath: (''+oThisScriptsPath.realpath),
                path    : (''+oThisScriptsPath.path).normalizeTrailingBackslashes(),
                isOSP   : (''+oThisScriptsPath.ext).toLowerCase() === '.osp'
            });
        }

        /**
         * @param {string} key config key
         * @param {boolean} val boolean
         * @param {config.TYPE} type value type
         * @param {string?} binding Script.config value to bind to
         * @param {string?} group group name on the configuration screen
         * @param {string?} desc description at the bottom of the configuration screen
         * @param {boolean=false} bypassValidation bypass validation
         */
         addValue(key: string, val: any, type: config.TYPE, binding?: string, group?: string, desc?: string, bypassValidation = false)
            : IResult<true, IException<ex.UninitializedException | ex.InvalidParameterValueException | ex.KeyAlreadyExistsException>> {
            var msg;
            if (typeof this.initData === 'undefined') {
                return UserExc(ex.UninitializedException, 'Base.addValue', 'InitData has not been set yet, call setInitData() in your OnInit() first');
            }
            if (this.items.hasOwnProperty(key)) {
                msg = key + ' already exists';
                this.showError(msg);
                return UserExc(ex.KeyAlreadyExistsException, 'Base.AddValue', msg);
            }
            if (!!!bypassValidation && !this.isValid(val, type)) {
                msg = 'type ' + type + ' does not accept given value ' + val;
                this.showError(msg);
                return UserExc(ex.InvalidParameterValueException, 'Base.AddValue', msg);
            }
            this.cntItems++;
            this.items[key] = <ConfigValue>{ val: val, default: val, type: type, binding: binding, group: group, desc: desc  };
            return g.ResultOk(true);
        }

        /**
         * Assigns the variables to their respective groups and assigns the descriptions to them.
         *
         * setInitData() method **must** have been called before calling this method.
         * @see {config.setInitData}
         */
        finalize(): IResult<true, IException<ex.UninitializedException>> {
            if (typeof this.initData === 'undefined') {
                return UserExc(ex.UninitializedException, 'Base.addValue', 'InitData has not been set yet, call setInitData() in your OnInit() first');
            }
            var config_groups = DOpus.create().map();
            var config_desc   = DOpus.create().map();

            for (const key in this.items) {
                const val:ConfigValue = this.items[key];
                // DOpus.output(libSprintfjs.sprintf(
                //     'FINALIZE -- key: %s, type: %s, val: %s, default: %s, group: %s, desc: %s',
                //     key,
                //     val.type,
                //     val.val,
                //     ''||val.default,
                //     val.group,
                //     val.desc
                // ));

                switch(val.type) {
                    case TYPE.JSON:
                        // @ts-ignore
                        this.initData.config[key] = JSON.stringify(val.val, null, 2).replace(/\n/mg, "\r\n");
                        break;
                    case TYPE.ARRAY:
                    case TYPE.POJO:
                        // @ts-ignore
                        this.initData.config[key] = JSON.stringify(val.val, null, 2).replace(/\n/mg, "\r\n");
                        break;
                    case TYPE.REGEXP:
                        // @ts-ignore
                        this.initData.config[key] = val.val.toString();
                        break;
                    default:
                        // @ts-ignore
                        this.initData.config[key] = val.val;
                };
                // this.initData.config[key] = val.type === TYPE.JSON ? JSON.stringify(val.val, null, 4).replace(/\n/mg, "\r\n") : val.val;
                config_groups.set(val.binding, val.group);
                config_desc.set(val.binding, val.desc);
            }
            // @ts-ignore
            this.initData.config_groups = config_groups;
            // @ts-ignore
            this.initData.config_desc   = config_desc;
            return g.ResultOk(true);
        }



        /**
         * Do not call this with DIALOG in main/global block of your script
         * otherwise script might fail to initialize!
         * @param {config.ERROR_MODE} errorMode
         */
        setErrorMode(errorMode: config.ERROR_MODE) {
            if (!config.ERROR_MODE.hasOwnProperty(errorMode)) {
                const msg = 'Error mode ' + errorMode + ' is not supported';
                DOpus.output(msg);
                g.showMessageDialog(null, msg);
            } else {
                this.defaultErrorMode = errorMode;
            }
        }
        getErrorMode(): config.ERROR_MODE {
            return this.defaultErrorMode;
        }
        showError(msg: string): false {
            switch (this.defaultErrorMode) {
                case ERROR_MODE.NONE: return false;           // you can use this as: if(!addBoolean(...)) {/*error*/}
                case ERROR_MODE.ERROR: throw new Error(msg);  // mainly for development
                case ERROR_MODE.DIALOG: { g.showMessageDialog(null, msg); return false; }
            }
        }

        /**
         * @param {any} val config value - uses the type set by addXXX-methods
         * @param {config.TYPE} type - use config.types
         * @returns {boolean} true if value is accepted
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
                    // does not work - return typeof val === 'string' && DOpus.fsUtil().exists(DOpus.fsUtil().resolve(val).toString());
                    return typeof val === 'string' && DOpus.fsUtil().exists(''+DOpus.fsUtil().resolve(val));
                case TYPE.ARRAY:
                    return typeof val === 'object' && val.length >= 0;
                case TYPE.POJO:
                    // any object without functions
                    if (typeof val !== 'object') {
                        return false;
                    }
                    for (var k in val) {
                        if (typeof val[k] === 'function') { return false; }
                    }
                    return true;
                case TYPE.OBJECT:
                    return typeof val === 'object';
                case TYPE.REGEXP:
                    if (typeof val !== 'string' && typeof val !== 'object') {
                        return false;
                    }
                    try { eval('new RegExp(' + val + ');'); return true; } catch (e) { return false }
                case TYPE.JSON:
                    try { JSON.parse(val); return true; } catch (e) { return false; }
                case TYPE.FUNCTION:
                    return typeof val === 'function';
                default:
                    this.showError('isValid(): ' + type + ' is not supported');
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
        getValue(key: string, autoGetDOpusValue = true): any {

            var usingConfigVal = false;
            if (!this.items.hasOwnProperty(key)) {
                return this.showError(key + ' does not exist');
            }

            var valueToProbe;
            // if (autoGetDOpusValue && typeof Script.config !== 'undefined' && typeof Script.config[this.items[key].binding] !== 'undefined') {
            if (autoGetDOpusValue && typeof Script.config !== 'undefined' && typeof this.items[key].binding !== 'undefined') {
                valueToProbe = Script.config[<string>this.items[key].binding];
                if (typeof valueToProbe === 'undefined' || valueToProbe === null) {
                    return this.showError('Script config has no value for ' + key + ', check the binding: ' + this.items[key].binding);
                }
                valueToProbe = this.convert(valueToProbe, this.items[key].type);
                if (typeof valueToProbe === 'undefined') {
                    return this.showError('Config value ' + this.items[key].binding + ' is not valid');
                }
                usingConfigVal = true;
            } else {
                valueToProbe = this.items[key].val;
            }

            if (!this.isValid(valueToProbe, this.items[key].type)) {
                return this.showError('Invalid value!\n\nKey:\t' + (usingConfigVal ? this.items[key].binding : key) + '\nValue:\t' + valueToProbe + '\nUsing:\t' + (usingConfigVal ? 'User Config' : 'Default'));
            }
            return valueToProbe;
        }
        safeConvertToRegexp(testString: string): RegExp | undefined {
            var res;
            if (typeof testString === 'string') {
                try { res = eval('new RegExp(' + testString + ');') } catch (e) { }
            }
            return res;
        }
        safeConvertToJSON(testString: string): Object | undefined {
            var res;
            if (typeof testString === 'string') {
                try { res = JSON.parse(testString); } catch (e) { }
            }
            return res;
        }

        convert(val: any, type: config.TYPE) {
            switch (type) {
                case TYPE.ARRAY:
                case TYPE.OBJECT:
                case TYPE.POJO: return this.safeConvertToJSON(val);
                case TYPE.PATH: return '' + DOpus.fsUtil().resolve(val);
                case TYPE.REGEXP: return this.safeConvertToRegexp(val);
                default: return val;
            }
        }
        /**
         * @param {string} key config key
         * @returns {config.TYPE|false} type of value
         */
        getType(key: string): config.TYPE | false {
            if (!this.items[key]) {
                this.showError(key + ' does not exist');
                return false;
            }
            return this.items[key].type;
        }
        /**
         * @param {string} key config key
         * @returns {string|false} bound Script.config key
         */
        getBinding(key: string): string | false {
            if (!this.items[key]) {
                this.showError(key + ' does not exist');
                return false;
            }
            return typeof this.items[key].binding;
        }
        /**
         * @param {string} bindTo bound config variable name
         * @returns {string|false} key name if found, false if not
         */
        findBinding(bindTo: string): string | false {
            for (var k in this.items) {
                if (this.items[k].binding === bindTo) {
                    return k;
                }
            }
            return false;
        }
        /**
         * @param {string} key config key
         * @param {any} val config value
         */
        setValue(key: string, val: any) {
            if (!this.items.hasOwnProperty(key)) {
                return this.showError(key + ' does not exist');
            }
            if (!this.isValid(val, this.items[key].type)) {
                return this.showError(key + ' must have type ' + this.items[key].type + ', given: ' + typeof val);
            }
            this.items[key].val = val;
        }
        /**
         * @param {string} key config key
         */
        delKey(key: string) {
            if (!this.items.hasOwnProperty(key)) {
                return this.showError(key + ' does not exist');
            }
            this.cntItems--;
            delete this.items[key];
        }
        delValue = this.delKey;
        /**
         * @param {string} key config key
         * @returns {boolean} true if key is valid
         */
        hasKey(key: string): boolean {
            return this.items.hasOwnProperty(key);
        }
        hasValue = this.hasKey;


        /** @returns {number} number of elements in the config */
        getCount(): number {
            return this.cntItems;
        }
        /** @returns {Array<string>} keys in the config */
        getKeys(): Array<string> {
            var keys = [];
            for (var k in this.items) keys.push(k);
            return keys;
        }
        /** @returns {string} stringified config */
        toString(): string {
            var vals: { [k: string]: any } = {};
            for (var k in this.items) vals[k] = this.items[k].val;
            return JSON.stringify(vals, null, 4);
        }

    }


    // not public, access via singleton below
    class User extends Base {
        constructor() {
            super();
        }
    }


    // not public, access via singleton below
    class ScriptExt extends Base {
        constructor() {
            super();
        }
        addPOJO(key: string) {
            // note there is no binding type, group, desc necessary for this method
            return super.addValue(key, {}, config.TYPE.POJO);
        }
        finalize(): IResult<true, IException<ex.UninitializedException>> {
            return UserExc(ex.UninitializedException, 'Base.addValue', 'InitData has not been set yet, call setInitData() in your OnInit() first');
        }
    }


    /**
     * Singleton access to user configurable parameters
     * i.e. via DOpus settings screen.
     */
    export const user = new User();
    /**
     * Singleton access to external configuration,
     * i.e. JSON-based config files accessible during script initialization
     * but without GUI.
     */
    export const ext = new ScriptExt();


}
