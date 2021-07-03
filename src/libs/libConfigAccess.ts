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
	return this.replace(/^\t\t/mg, '  ').replace(/^\t/mg, '');
};
String.prototype.substituteVars = function () {
	return this.replace(/\${([^}]+)}/g, function (match, p1) {
		return typeof eval(p1) !== 'undefined'
			? eval(p1)
			: 'undefined';
	});
};



namespace config {

    /**
     * Object types supported by the configuration.
     *
     * Note that you are not necessarily limited to JS object types,
     * one could easily extend this enum,
     * add the proper check to validation method and use the new type.
     *
     * E.g. a phone number could be implemented as
     * TYPE.phonenum = 'PHONENUM'
     *
     * and in validation method:
     * var rePN = /^\d{3}-[\d\-]+$/; // or whatever format you use
     * return rePN.test(inputPhoneNum);
     *
     * In fact, this file does not have to be changed
     * to extend the enum. One can do this:
     * ```
     * namespace config {
     *   export enum TYPE {
     *     PHONENUM = 'PHONENUM',
     *   }
     *   var isValidOrig = user.isValid;
     *   user.isValid = function(val: any, type: config.TYPE) {
     *     switch(type) {
     *       case config.TYPE.PHONENUM:
     *         const rePN = /^\d{3}-[\d\-]+$/; // or whatever format you use
     *         return rePN.test(val);
     *       default:
     *         return isValidOrig(val, type);
     *     }
     *   }
     * }
     * ```
     * and now you can directly use the existing types
     * plus the new one:
     * ```
     * DOpus.output(config.user.isValid('123-456', config.TYPE.PHONENUM).toString());
     * DOpus.output(config.user.isValid('123-456', config.TYPE.STRING).toString());
     * ```
     *
     */
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
        NONE   = 'NONE',
        ERROR  = 'ERROR',
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
        binding: string,
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

        private _count				= 0;
        private _error_mode   		= ERROR_MODE.ERROR;
        private items:ConfigItems 	= {};

        constructor() {
            // nothing yet
        }

        // internal method called by OnInit()
        addToConfigVar(initData: DOpusScriptInitData, group: string, name: string, desc: string, value: any) {
            throw new Error("config.addToConfigVar() - Not implemented yet");
            // var cfg                     = this.getBinding(name);;
            // initData.config[cfg]		= value || this.getValue(name);
            // // initData.config_desc(cfg)	= desc;
            // // initData.config_groups(cfg)	= group;
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
            switch(this._error_mode) {
                case ERROR_MODE.NONE:   return false;				// you can use this as: if(!addBoolean(...)) {/*error*/}
                case ERROR_MODE.ERROR:  throw new Error(msg);		// mainly for development
                case ERROR_MODE.DIALOG: { g.showMessageDialog(null, msg); return false; }
            }
        }

        /**
         * @param {any} val config value - uses the type set by addXXX-methods
         * @param {config.TYPE} type - use config.types
         * @returns {boolean} true if value is accepted
         */
        isValid(val: any, type: TYPE): boolean {
            switch(type) {
                case TYPE.BOOLEAN:
                    return typeof val === 'boolean';
                case TYPE.STRING:
                    return typeof val === 'string';
                case TYPE.NUMBER:
                    return typeof val === 'number';
                case TYPE.PATH:
                    return typeof val === 'string' && DOpus.fsUtil().exists(DOpus.fsUtil().resolve(val).toString());
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
                    try { eval('new RegExp(' + val + ');'); return true; } catch(e) { return false }
                case TYPE.JSON:
                    try { JSON.parse(val); return true; } catch(e) { return false; }
                case TYPE.FUNCTION:
                    return typeof val === 'function';
                default:
                    this.showError('isValid(): ' + type + ' is not supported');
                    return false;
            }
        }

        /**
         *
         * @param {string} key config key
         * @param {boolean} val boolean
         * @param {string} bindTo Script.config value to bind to
         * @param {config.TYPE} type value type
         * @param {boolean=false} bypassValidation bypass validation
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addValueWithBinding(key: string, val: any, type: config.TYPE, bindTo?: string, bypassValidation = false) {
            if (this.items.hasOwnProperty(key)) {
                return this.showError(key + ' already exists');
            }
            if (!!!bypassValidation && !this.isValid(val, type)) {
                return this.showError('type ' + type + ' does not accept given value ' + val);
            }
            this._count++;
            this.items[key] = <ConfigValue>{ val: val, type: type, binding: bindTo };
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
            if (autoGetDOpusValue && typeof Script.config !== 'undefined' && typeof Script.config[this.items[key].binding] !== 'undefined') {
                valueToProbe = Script.config[this.items[key].binding];
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
        safeConvertToRegexp(testString: string): RegExp|undefined {
            var res;
            if (typeof testString === 'string') {
                try { res = eval('new RegExp(' + testString + ');') } catch(e) {}
            }
            return res;
        }
        safeConvertToJSON(testString: string): Object|undefined {
            var res;
            if (typeof testString === 'string') {
                try { res = JSON.parse(testString); } catch(e) {}
            }
            return res;
        }

        convert(val: any, type: config.TYPE) {
            switch(type) {
                case TYPE.ARRAY:
                case TYPE.OBJECT:
                case TYPE.POJO:		return this.safeConvertToJSON(val);
                case TYPE.PATH:		return DOpus.fsUtil().resolve(val) + '';
                case TYPE.REGEXP:	return this.safeConvertToRegexp(val);
                default:			return val;
            }
        }
        /**
         * @param {string} key config key
         * @returns {config.TYPE|false} type of value
         */
        getType(key: string): config.TYPE|false {
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
        getBinding(key: string): string|false {
            if (!this.items[key]) {
                return this.showError(key + ' does not exist');
            }
            return typeof this.items[key].binding;
        }
        /**
         * @param {string} bindTo bound config variable name
         * @returns {string|false} key name if found, false if not
         */
        findBinding(bindTo: string): string|false {
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
            // 	DOpus.Output('regexp requested');
            // 	_tmp = SafeRegexpConvert(val);
            // 	if (_tmp === false) {
            // 		return this.showError(key + ' must have type ' + this.items[key].type + ', given value cannot be parsed as such');
            // 	}
            // 	val = _tmp;
            // } else if (this.items[key].type === SUPPORTED_TYPES.JSON && typeof val === 'string') {
            // 	DOpus.Output('json requested');
            // 	_tmp = SafeJSONConvert(val);
            // 	if (_tmp === false) {
            // 		return this.showError(key + ' must have type ' + this.items[key].type + ', given value cannot be parsed as such');
            // 	}
            // 	val = _tmp;
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
        getCount (): number {
            return this._count;
        }
        /**
         * @returns {Array<string>} keys in the config
         */
        getKeys (): Array<string> {
            var keys = [];
            for (var k in this.items) keys.push(k);
            return keys;
        }
        /**
         * @returns {string} stringified config
         */
        toString (): string {
            var vals:{[k: string]: any} = {};
            for (var k in this.items) vals[k] = this.items[k].val;
            return JSON.stringify(vals, null, 4);
        }



        /**
         * @param {string} key config key
         * @param {boolean} val boolean
         * @param {string} bindTo Script.config value to bind to
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addBoolean (key: string, val: boolean, bindTo: string) {
            return this.addValueWithBinding(key, val, config.TYPE.BOOLEAN, bindTo);
        }
        /**
         * @param {string} key config key
         * @param {string} val string
         * @param {string} bindTo Script.config value to bind to
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addString (key: string, val: string, bindTo: string) {
            return this.addValueWithBinding(key, val, config.TYPE.STRING, bindTo);
        }
        /**
         * @param {string} key config key
         * @param {number} val number (int, float...)
         * @param {string} bindTo Script.config value to bind to
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addNumber (key: string, val: number, bindTo: string) {
            return this.addValueWithBinding(key, val, config.TYPE.NUMBER, bindTo);
        }
        /**
         * given path is auto-resolved & checked for existence
         *
         * @param {string} key config key
         * @param {string} val path
         * @param {string} bindTo Script.config value to bind to
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addPath (key: string, val: string, bindTo: string) {
            return this.addValueWithBinding(key, val, config.TYPE.PATH, bindTo);
        }
        /**
         * @param {string} key config key
         * @param {array} val array
         * @param {string} bindTo Script.config value to bind to
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addArray (key: string, val: Array<any>, bindTo: string) {
            return this.addValueWithBinding(key, val, config.TYPE.ARRAY, bindTo);
        }
        /**
         * @param {string} key config key
         * @param {object} val POJO, object without functions
         * @param {string} bindTo Script.config value to bind to
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addPOJO (key: string, val: object, bindTo: string) {
            return this.addValueWithBinding(key, val, config.TYPE.POJO, bindTo);
        }
        /**
         * @param {string} key config key
         * @param {object} val object
         * @param {string} bindTo Script.config value to bind to
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addObject (key: string, val: object, bindTo: string) {
            return this.addValueWithBinding(key, val, config.TYPE.OBJECT, bindTo);
        }
        /**
         * @param {string} key config key
         * @param {regexp} val regexp
         * @param {string} bindTo Script.config value to bind to
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addRegexp (key: string, val: RegExp, bindTo: string) {
            return this.addValueWithBinding(key, val, config.TYPE.REGEXP, bindTo);
        }
        /**
         * @param {string} key config key
         * @param {string} val JSON
         * @param {string} bindTo Script.config value to bind to
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addJSON (key: string, val: string, bindTo: string) {
            return this.addValueWithBinding(key, val, config.TYPE.JSON, bindTo);
        }
        /**
         * @param {string} key config key
         * @param {function} val function
         * @param {string} bindTo Script.config value to bind to
         * @throws error (in ERROR_MODES.ERROR) if key already exists or value is invalid
         */
        addFunction (key: string, val: Function, bindTo: string) {
            return this.addValueWithBinding(key, val, config.TYPE.FUNCTION, bindTo);
        }



    }

    export class User extends Base {
        constructor() {
            super();
        }
    }

    export class ScriptExt extends Base {
        constructor() {
            super();
        }
        addPOJO(key: string) {
            return super.addValueWithBinding(key, {}, config.TYPE.POJO, undefined);
        }
    }

    export const user = new Base();
    export const ext  = new ScriptExt();

}
