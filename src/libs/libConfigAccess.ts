/* global ActiveXObject Enumerator DOpus Script */
/* eslint indent: [2, 4, {"SwitchCase": 1}] */
///<reference path='../_DOpusDefinitions.d.ts' />
///<reference path='../_Helpers.d.ts' />
///<reference path='./libDOpusHelper.ts' />
///<reference path='./libGlobal.ts' />

interface String {
    normalizeLeadingWhiteSpace(): string;
    substituteVars(): string;
}

// methods for pseudo-HEREDOCs
String.prototype.normalizeLeadingWhiteSpace = function () {
    return this.replace(/^\t\t|\s{8}/mg, '  ').replace(/^\t|\s{4}/mg, '');
};
String.prototype.substituteVars = function () {
    return this.replace(/\${([^}]+)}/g, function (match, p1) {
        return typeof eval(p1) !== 'undefined'
            ? eval(p1)
            : 'undefined';
    });
};


/**
 * # How to use:
 *
 * Write any top-level functions callable from OnInit(), e.g.
 * ```typescript
 *   function setupConfigVars(initData: DOpusScriptInitData) {
 *     // more to this below
 *   }
 * ```
 *
 * in OnInit() call it with the scriptInitData you get automatically from DOpus, e.g.
 * ```typescript
 *   setupConfigVars(initData);
 * ```
 *
 * Your method should look like this
 * ```typescript
 *   //
 *   // config.user: UI-configured settings
 *   //
 *   config.user.setInitData(initData);
 *   // ...
 *   config.user.addNumber(...)
 *   config.user.addString(...)
 *   // ...
 *   // required for setting up the config UI groups & descriptions
 *   config.user.finalize();
 *
 *   //
 *   // config.ext: Externally configured settings
 *   //
 *   config.ext.setInitData(initData);
 *   config.ext.addPOJO('ext_config_pojo', objYourPOJO);
 *   // or shorter
 *   config.ext.setInitData(initData).addPOJO('ext_config_pojo', objYourPOJO);
 *   // config.ext.finalize() is not unnecessary and will throw exception if called
 * ```
 *
 * The order in which you call config.user and config.ext methods doesn't matter.
 *
 * Of course, you can do it all in your OnInit() method directly.
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
 *   export enum TYPE {
 *     PHONENUM = 'PHONENUM',
 *   }
 *   const isValidOrig = user.isValid; // necessary to avoid recursion
 *   user.isValid = function(val: any, type: config.TYPE) {
 *     const rePN = /^\d{3}-[\d\-]+$/; // or whatever format you use
 *     switch(type) {
 *       case config.TYPE.PHONENUM:
 *         return rePN.test(val);
 *       default:
 *         return isValidOrig(val, type);
 *     }
 *   }
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

    /**
     * Object types supported by the configuration.
     *
     * Note that you are not necessarily limited to JS object types,
     * one could easily extend this enum,
     * add the proper check to validation method and use the new type.
     *
     * E.g. a phone number could be implemented as
     * ```typescript
     *   TYPE.phonenum = 'PHONENUM'
     * ```
     *
     * and in validation method:
     * ```typescript
     *   var rePN = /^\d{3}-[\d\-]+$/; // or whatever format you use
     *   return rePN.test(inputPhoneNum);
     * ```
     *
     * In fact, this file does not have to be changed
     * to extend the enum. One can do this:
     * ```typescript
     * namespace config {
     *   export enum TYPE {
     *     PHONENUM = 'PHONENUM',
     *   }
     *   var isValidOrig = user.isValid;
     *   user.isValid = function(val: any, type: config.TYPE) {
     *     const rePN = /^\d{3}-[\d\-]+$/; // or whatever format you use
     *     switch(type) {
     *       case config.TYPE.PHONENUM:
     *         return rePN.test(val);
     *       default:
     *         return isValidOrig(val, type);
     *     }
     *   }
     * }
     * ```
     * and now you can directly use the existing types
     * plus the new one:
     * ```typescript
     * DOpus.output(config.user.isValid('123-456', config.TYPE.PHONENUM).toString());
     * DOpus.output(config.user.isValid('123-456', config.TYPE.STRING).toString());
     * ```
     *
     */

    export enum TYPE {
        BOOLEAN = 'BOOLEAN',
        STRING = 'STRING',
        NUMBER = 'NUMBER',
        PATH = 'PATH',
        ARRAY = 'ARRAY',
        POJO = 'POJO',
        OBJECT = 'OBJECT',
        REGEXP = 'REGEXP',
        JSON = 'JSON',
        FUNCTION = 'FUNCTION',
    }
    export enum ERROR_MODE {
        NONE = 'NONE',
        ERROR = 'ERROR',
        DIALOG = 'DIALOG',
    }

    type ConfigValue = {
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

        // do not try to display any dialog during DOpus startup and until OnInit() finishes
        // i.e. no such shenanigans
        // config.setErrorMode(config.error.DIALOG);
        // config.addSimple('i', false, config.type.NUMBER, false);
        // var dlg;

        private _count = 0;
        private _error_mode = ERROR_MODE.ERROR;
        private items: ConfigItems = {};
        private initData: DOpusScriptInitData | undefined;

        constructor(initData?: DOpusScriptInitData) {
        }

        /**
         *
         * @param {DOpusScriptInitData} initData got from DOpus OnInit() method
         * @returns {this} for method chaining
         */
        setInitData(initData: DOpusScriptInitData): this {
            this.initData = initData;
            return this;
        }
        finalize() {
            if (typeof this.initData === 'undefined') {
                DOpus.output('initdata: ' + this.initData);
                // TODO
                // throw new exc.DeveloperStupidityException('InitData has not been set, call setInitData() before calling this', this.addValueWithBinding);
                this.showError('InitData has not been set, call setInitData() before calling this');
            }
            var config_groups = DOpus.create().map();
            var config_desc   = DOpus.create().map();

            for (const key in this.items) {
                const val:ConfigValue = this.items[key];
                DOpus.output(libSprintfjs.sprintf(
                    'key: %s, type: %s, val: %s, default: %s, group: %s, desc: %s',
                    key,
                    val.type,
                    ' ' || val.val,
                    val.default,
                    val.group,
                    val.desc
                ));
                // this.initData.config[key] = val.val;
                // @ts-ignore
                this.initData.config[key] = val.type === TYPE.JSON ? JSON.stringify(val.val, null, 4).replace(/\n/mg, "\r\n") : val.val;
                config_groups.set(val.binding, val.group);
                config_desc.set(val.binding, val.desc);
            }
            // @ts-ignore
            this.initData.config_groups = config_groups;
            // @ts-ignore
            this.initData.config_desc   = config_desc;
            // this.initData.config[key] = val;
            // this.initData?.config_groups.set(binding, group);
            // this.initData?.config_desc.set(binding, group);
        }

        // internal method called by OnInit()
        addToConfigVar(initData: DOpusScriptInitData, group: string, name: string, desc: string, value: any) {
            throw new Error("config.addToConfigVar() - Not implemented yet");
            // var cfg                     = this.getBinding(name);;
            // initData.config[cfg]        = value || this.getValue(name);
            // // initData.config_desc(cfg) = desc;
            // // initData.config_groups(cfg) = group;
            // initData.config_desc.set(cfg, desc);
            // initData.config_groups.set(cfg, group);
        }

        setErrorMode(em: config.ERROR_MODE) {
            // do not call this with ERROR in main/global block otherwise script might fail to initialize
            // if (!ERROR_MODES.hasOwnProperty(em)) {
            if (typeof em !== typeof config.ERROR_MODE) {
                var msg = 'Error mode ' + em + ' is not supported';
                DOpus.output(msg);
                g.showMessageDialog(null, msg);
                return;
            }
            this._error_mode = em;
        }
        getErrorMode(): config.ERROR_MODE {
            return this._error_mode;
        }
        showError(msg: string): false {
            switch (this._error_mode) {
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
         * @param {string} key config key
         * @param {boolean} val boolean
         * @param {config.TYPE} type value type
         * @param {string?} binding Script.config value to bind to
         * @param {string?} group group name on the configuration screen
         * @param {string?} desc description at the bottom of the configuration screen
         * @param {boolean=false} bypassValidation bypass validation
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addValueWithBinding(key: string, val: any, type: config.TYPE, binding?: string, group?: string, desc?: string, bypassValidation = false) {
            if (typeof this.initData === 'undefined') {
                DOpus.output('initdata: ' + this.initData + ', key: ' + key + ', val: ' + val);
                // TODO
                // throw new exc.DeveloperStupidityException('InitData has not been set, call setInitData() before calling this', this.addValueWithBinding);
                this.showError('InitData has not been set, call setInitData() before calling this');
            } else {
                DOpus.output('initdata: ' + this.initData.file + ', key: ' + key + ', val: ' + val);
            }
            if (this.items.hasOwnProperty(key)) {
                return this.showError(key + ' already exists');
            }
            if (!!!bypassValidation && !this.isValid(val, type)) {
                return this.showError('type ' + type + ' does not accept given value ' + val);
            }
            this._count++;
            this.items[key] = <ConfigValue>{ val: val, type: type, binding: binding, group: group, desc: desc  };

            // this.initData.config[key] = val;
            // this.initData?.config_groups.set(binding, group);
            // this.initData?.config_desc.set(binding, group);
            return true;
        }
        /**
         * auto-checks the current Script.config value this key is bound to
         * and returns the current value if valid and default value if invalid
         *
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
                case TYPE.PATH: return DOpus.fsUtil().resolve(val) + '';
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
                return this.showError(key + ' does not exist');
            }
            // return this.items[key].type;
            return this.items[key].type;
        }
        /**
         * @param {string} key config key
         * @returns {string|false} bound Script.config key
         */
        getBinding(key: string): string | false {
            if (!this.items[key]) {
                return this.showError(key + ' does not exist');
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
            // DOpus.Output('this.items[key].type: ' + this.items[key].type);
            // var _tmp;
            // if (this.items[key].type === SUPPORTED_TYPES.REGEXP && typeof val === 'string') {
            //  DOpus.Output('regexp requested');
            //  _tmp = SafeRegexpConvert(val);
            //  if (_tmp === false) {
            //   return this.showError(key + ' must have type ' + this.items[key].type + ', given value cannot be parsed as such');
            //  }
            //  val = _tmp;
            // } else if (this.items[key].type === SUPPORTED_TYPES.JSON && typeof val === 'string') {
            //  DOpus.Output('json requested');
            //  _tmp = SafeJSONConvert(val);
            //  if (_tmp === false) {
            //   return this.showError(key + ' must have type ' + this.items[key].type + ', given value cannot be parsed as such');
            //  }
            //  val = _tmp;
            // }
            // this.items[key].val = val;
            this.items[key].val = val;
        }
        /**
         * @param {string} key config key
         * @throws error (in ERROR_MODES.ERROR) if key does not exist
         */
        delKey(key: string) {
            if (!this.items.hasOwnProperty(key)) {
                return this.showError(key + ' does not exist');
            }
            this._count--;
            delete this.items[key];
            // var _tmp = this.items[key].val;
            // delete this.items[key].val;
            // delete this.items[key].type;
            // delete this.items[key].binding;
            // return _tmp;
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




        /**
         * @returns {number} number of elements in the config
         */
        getCount(): number {
            return this._count;
        }
        /**
         * @returns {Array<string>} keys in the config
         */
        getKeys(): Array<string> {
            var keys = [];
            for (var k in this.items) keys.push(k);
            return keys;
        }
        /**
         * @returns {string} stringified config
         */
        toString(): string {
            var vals: { [k: string]: any } = {};
            for (var k in this.items) vals[k] = this.items[k].val;
            return JSON.stringify(vals, null, 4);
        }

        /*
            'SHORTCUTS' for the binding type
        */

        /**
         * @param {string} key config key
         * @param {boolean} val boolean
         * @param {string} bindTo Script.config value to bind to
         * @param {string=} group group name on the configuration screen
         * @param {string=} desc description at the bottom of the configuration screen
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addBoolean(key: string, val: boolean, bindTo: string, group?: string, desc?: string) {
            return this.addValueWithBinding(key, val, config.TYPE.BOOLEAN, bindTo, group, desc);
        }
        /**
         * @param {string} key config key
         * @param {string} val string
         * @param {string} bindTo Script.config value to bind to
         * @param {string=} group group name on the configuration screen
         * @param {string=} desc description at the bottom of the configuration screen
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addString(key: string, val: string, bindTo: string, group?: string, desc?: string) {
            return this.addValueWithBinding(key, val, config.TYPE.STRING, bindTo, group, desc);
        }
        /**
         * @param {string} key config key
         * @param {number} val number (int, float...)
         * @param {string} bindTo Script.config value to bind to
         * @param {string=} group group name on the configuration screen
         * @param {string=} desc description at the bottom of the configuration screen
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addNumber(key: string, val: number, bindTo: string, group?: string, desc?: string) {
            return this.addValueWithBinding(key, val, config.TYPE.NUMBER, bindTo, group, desc);
        }
        /**
         * given path is auto-resolved & checked for existence
         *
         * @param {string} key config key
         * @param {string} val path
         * @param {string} bindTo Script.config value to bind to
         * @param {string=} group group name on the configuration screen
         * @param {string=} desc description at the bottom of the configuration screen
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addPath(key: string, val: string, bindTo: string, group?: string, desc?: string) {
            return this.addValueWithBinding(key, val, config.TYPE.PATH, bindTo, group, desc);
        }
        /**
         * @param {string} key config key
         * @param {array} val array
         * @param {string} bindTo Script.config value to bind to
         * @param {string=} group group name on the configuration screen
         * @param {string=} desc description at the bottom of the configuration screen
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addArray(key: string, val: Array<any>, bindTo: string, group?: string, desc?: string) {
            return this.addValueWithBinding(key, val, config.TYPE.ARRAY, bindTo, group, desc);
        }
        /**
         * @param {string} key config key
         * @param {object} val POJO, object without functions
         * @param {string} bindTo Script.config value to bind to
         * @param {string=} group group name on the configuration screen
         * @param {string=} desc description at the bottom of the configuration screen
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addPOJO(key: string, val: object, bindTo: string, group?: string, desc?: string) {
            return this.addValueWithBinding(key, val, config.TYPE.POJO, bindTo, group, desc);
        }
        /**
         * @param {string} key config key
         * @param {object} val object
         * @param {string} bindTo Script.config value to bind to
         * @param {string=} group group name on the configuration screen
         * @param {string=} desc description at the bottom of the configuration screen
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addObject(key: string, val: object, bindTo: string, group?: string, desc?: string) {
            return this.addValueWithBinding(key, val, config.TYPE.OBJECT, bindTo, group, desc);
        }
        /**
         * @param {string} key config key
         * @param {regexp} val regexp
         * @param {string} bindTo Script.config value to bind to
         * @param {string=} group group name on the configuration screen
         * @param {string=} desc description at the bottom of the configuration screen
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addRegexp(key: string, val: RegExp, bindTo: string, group?: string, desc?: string) {
            return this.addValueWithBinding(key, val, config.TYPE.REGEXP, bindTo, group, desc);
        }
        /**
         * @param {string} key config key
         * @param {string} val JSON
         * @param {string} bindTo Script.config value to bind to
         * @param {string=} group group name on the configuration screen
         * @param {string=} desc description at the bottom of the configuration screen
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addJSON(key: string, val: string, bindTo: string, group?: string, desc?: string) {
            return this.addValueWithBinding(key, val, config.TYPE.JSON, bindTo, group, desc);
        }
        /**
         * @param {string} key config key
         * @param {function} val function
         * @param {string} bindTo Script.config value to bind to
         * @param {string=} group group name on the configuration screen
         * @param {string=} desc description at the bottom of the configuration screen
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addFunction(key: string, val: Function, bindTo: string, group?: string, desc?: string) {
            return this.addValueWithBinding(key, val, config.TYPE.FUNCTION, bindTo, group, desc);
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
            return super.addValueWithBinding(key, {}, config.TYPE.POJO);
        }
        finalize() {
            throw new Error('This method should not be called for external files');
        }
    }


    /**
     * Singleton access to user configurable parameters
     * i.e. via DOpus settings screen.
     */
    export const user = new Base();
    /**
     * Singleton access to external configuration,
     * i.e. JSON-based config files accessible during script initialization
     * but without GUI.
     */
    export const ext = new ScriptExt();


}
