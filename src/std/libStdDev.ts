// @ts-check
/* global ActiveXObject Enumerator DOpus Script */
// see https://www.typescriptlang.org/docs/handbook/namespaces-and-modules.html
///<reference path='./_DOpusDefinitions.d.ts' />
///<reference path='./libSprintf.js' />

/*
     .d8888b.  888       .d88888b.  888888b.          d8888 888
    d88P  Y88b 888      d88P" "Y88b 888  "88b        d88888 888
    888    888 888      888     888 888  .88P       d88P888 888
    888        888      888     888 8888888K.      d88P 888 888
    888  88888 888      888     888 888  "Y88b    d88P  888 888
    888    888 888      888     888 888    888   d88P   888 888
    Y88b  d88P 888      Y88b. .d88P 888   d88P  d8888888888 888
     "Y8888P88 88888888  "Y88888P"  8888888P"  d88P     888 88888888
*/



/*
        8888888888 888b    888 888     888 888b     d888  .d8888b.
        888        8888b   888 888     888 8888b   d8888 d88P  Y88b
        888        88888b  888 888     888 88888b.d88888 Y88b.
        8888888    888Y88b 888 888     888 888Y88888P888  "Y888b.
        888        888 Y88b888 888     888 888 Y888P 888     "Y88b.
        888        888  Y88888 888     888 888  Y8P  888       "888
        888        888   Y8888 Y88b. .d88P 888   "   888 Y88b  d88P
        8888888888 888    Y888  "Y88888P"  888       888  "Y8888P"
*/


/*
    8888888 888b    888 88888888888 8888888888 8888888b.  8888888888     d8888  .d8888b.  8888888888  .d8888b.
      888   8888b   888     888     888        888   Y88b 888           d88888 d88P  Y88b 888        d88P  Y88b
      888   88888b  888     888     888        888    888 888          d88P888 888    888 888        Y88b.
      888   888Y88b 888     888     8888888    888   d88P 8888888     d88P 888 888        8888888     "Y888b.
      888   888 Y88b888     888     888        8888888P"  888        d88P  888 888        888            "Y88b.
      888   888  Y88888     888     888        888 T88b   888       d88P   888 888    888 888              "888
      888   888   Y8888     888     888        888  T88b  888      d8888888888 Y88b  d88P 888        Y88b  d88P
    8888888 888    Y888     888     8888888888 888   T88b 888     d88P     888  "Y8888P"  8888888888  "Y8888P"
*/
interface IResult<S,E> {
    ok: S;
    err: E;
    stack: Array<any>;
    isOk(): boolean;
    isValid(): boolean;
    isErr(): boolean;
    toString(): string;
}

interface String {
    trim(): string;
}

interface Error {
    // add where for custom exceptions
    where: string;
}

interface String {
    /**
     * makes sure that the paths always have a trailing backslash but no doubles
     * this happens mainly because the oItem.path does not return a trailing slash for any directory
     * other than root dir of a drive, i.e. it returns Y:\Subdir (no BS) but Y:\ (with BS)
     */
    normalizeTrailingBackslashes(): string;

    /**
     * substitutes variables - Only Global ones - in the given string
     * e.g.
     * my name is: ${Global.SCRIPT_NAME}
     */
    substituteVars(): string;

    /**
     * parses string as number in base 10
     * e.g.
     * cmdData.func.args.MAXCOUNT.asInt()
     */
    asInt(): number;

    normalizeLeadingWhiteSpace(): string;
    substituteVars(): string;
}



/*
        8888888888 Y88b   d88P  .d8888b.  8888888888 8888888b. 88888888888 8888888  .d88888b.  888b    888  .d8888b.
        888         Y88b d88P  d88P  Y88b 888        888   Y88b    888       888   d88P" "Y88b 8888b   888 d88P  Y88b
        888          Y88o88P   888    888 888        888    888    888       888   888     888 88888b  888 Y88b.
        8888888       Y888P    888        8888888    888   d88P    888       888   888     888 888Y88b 888  "Y888b.
        888           d888b    888        888        8888888P"     888       888   888     888 888 Y88b888     "Y88b.
        888          d88888b   888    888 888        888           888       888   888     888 888  Y88888       "888
        888         d88P Y88b  Y88b  d88P 888        888           888       888   Y88b. .d88P 888   Y8888 Y88b  d88P
        8888888888 d88P   Y88b  "Y8888P"  8888888888 888           888     8888888  "Y88888P"  888    Y888  "Y8888P"
*/

/**
 * Rust-like value returning exceptions, to be used in Results.
 *
 * e.g.
 * ```typescript
 *   // in some method
 *   return
 *
 *
 *   if (myIResultVar.err === err.JSONParsingException) { ... }
 * ```
 *
 *
 * Never use the assigned values, e.g. 1, 2, 3
 * the order, thus the assigned values, might be changed any time.
 *
 * @see {IResult}
 */

/**
 * @param {function} fnCaller
 * @param {string} message
 * @param {string|function} where
 * @constructor
 */
interface IException<T> {
    /** Internal type number, never use it directly/hard-coded */
    readonly type: T;
    /** Exception name, e.g. 'NotImplementedYetException' */
    readonly name: string;
    /** Message from the exception raiser */
    readonly message: string;
    /** Where the exception has occurred; this is not automatically set, i.e. it's up to the raiser to set this correctly */
    readonly where: string;
}
class UserException implements IException<ex> {
    public readonly type: ex;
    public readonly name: string;
    public readonly where: string;
    public readonly message: string;
    /**
     * @param {ex} type enum type number
     * @param {string | Function} where the exception occurred, if function is passed, it will be attempted to extract the name, may fail anonymous and class member functions
     * @param {string} message exception details
     * @constructor
     */
    constructor (type: ex, where: string | Function, message?: string) {
        this.type    = type;
        this.name    = ex[type];
        this.where   = typeof where === 'string' ? where : g.funcNameExtractor(where);
        this.message = message || '<no message passed>';
    }
}
function UserExc(type: ex, where: string | Function, message?: string): IResult<any, IException<ex>> {
    return new g.Result(false, new UserException(type, where, message));
}

enum ex {
    /** Method/function not implemented yet */
    NotImplementedYetException,
    /** Requirements have not been initialized yet  */
    UninitializedException,
    /** The dev made a stupid mistake, it's a bug that should have been caught */
    DeveloperStupidityException,
    /** MTH Manager does not recognize given command */
    InvalidManagerCommandException,
    /** Given string is not valid JSON */
    JSONParsingException,
    /** Given parameter type does not match expected type */
    InvalidParameterTypeException,
    /** Given parameter value is not accepted */
    InvalidParameterValueException,
    /** Errors while reading from or writing into ADS stream */
    StreamReadWriteException,
    /** File could not be created */
    FileCreateException,
    /** File could not be read */
    FileReadException,


    InvalidFormatException,
    UnsupportedFormatException,
    ThreadPoolMissException,
    InvalidNumberException,
    UserAbortedException,
    SanityCheckException,
    KeyAlreadyExistsException,
    KeyDoesNotExistException,
    InvalidUserParameterException,
}



/*
     .d8888b. 88888888888 8888888b.       .d88888b.  888888b. 888888         8888888888 Y88b   d88P 88888888888
    d88P  Y88b    888     888  "Y88b     d88P" "Y88b 888  "88b  "88b         888         Y88b d88P      888
    Y88b.         888     888    888     888     888 888  .88P   888         888          Y88o88P       888
     "Y888b.      888     888    888     888     888 8888888K.   888         8888888       Y888P        888
        "Y88b.    888     888    888     888     888 888  "Y88b  888         888           d888b        888
          "888    888     888    888     888     888 888    888  888         888          d88888b       888
    Y88b  d88P    888     888  .d88P     Y88b. .d88P 888   d88P  88P d8b     888         d88P Y88b      888   d8b
     "Y8888P"     888     8888888P"       "Y88888P"  8888888P"   888 Y8P     8888888888 d88P   Y88b     888   Y8P
                                                               .d88P
                                                             .d88P"
                                                            888P"
*/

// methods for pseudo-HEREDOCs
String.prototype.normalizeLeadingWhiteSpace = function () {
    // the §s help with avoiding backtracking
    return this
        // .trim()
        .replace(/^\t\t\t|^ {12}/mg, '§§§')
        .replace(/^\t\t|^ {8}/mg, '§§')
        .replace(/^\t|^ {4}/mg, '§')
        .replace(/^§§§/mg, '    ')
        .replace(/^§§/mg, '  ')
        .replace(/^§/mg, '')
        .trim()
        .replace(/\n/g, '\r\n')
        .replace(/\n\n/g, '\n')
        ;
};
String.prototype.substituteVars = function () {
    return this.replace(/\${([^}]+)}/g, function (match, p1) {
        return typeof eval(p1) !== 'undefined'
            ? eval(p1)
            : 'undefined';
    });
};

/**
 * Makes sure that the paths always have 1 trailing backslash but no doubles.
 * This happens mainly because the oItem.path does not return a trailing slash
 * for any directory other than root dir of a drive,
 * i.e. it returns Y:\Subdir (no backslash) but Y:\ (with backslash)
 */
String.prototype.normalizeTrailingBackslashes = function () {
    return (this + '\\').replace(/\\\\/g, '\\').replace(/^\\$/, '');
};


/** A shorter, type-safe alternative to parseInt */
String.prototype.asInt = function () {
    var num = parseInt(this.valueOf(), 10);
    if (isNaN(num)) {
        throw new UserException(ex.InvalidNumberException, 'asInt', 'This string cannot be parsed as a number: ' + this.valueOf());
    }
    return num;
};

// /** Trim for JScript */
// String.prototype.trim = function () {
//     return this.replace(/^\s+|\s+$/g, ''); // not even trim() JScript??
// };
// better alternative
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
}


// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
    Object.keys = (function () {
        'use strict';
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
            dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ],
            dontEnumsLength = dontEnums.length;

        return function (obj: any) {
            if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
                throw new TypeError('Object.keys called on non-object');
            }

            var result = [], prop, i;

            for (prop in obj) {
                if (hasOwnProperty.call(obj, prop)) {
                    result.push(prop);
                }
            }

            if (hasDontEnumBug) {
                for (i = 0; i < dontEnumsLength; i++) {
                    if (hasOwnProperty.call(obj, dontEnums[i])) {
                        result.push(dontEnums[i]);
                    }
                }
            }
            return result;
        };
    }());
}


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
if (!Array.prototype.filter) {
    Array.prototype.filter = function (func: Function, thisArg: undefined) {
        'use strict';
        // @ts-ignore
        if (!((typeof func === 'Function' || typeof func === 'function') && this))
            throw new TypeError();

        var len = this.length >>> 0,
            res = new Array(len), // preallocate array
            t = this, c = 0, i = -1;

        var kValue;
        if (thisArg === undefined) {
            while (++i !== len) {
                // checks to see if the key was set
                if (i in this) {
                    kValue = t[i]; // in case t is changed in callback
                    if (func(t[i], i, t)) {
                        res[c++] = kValue;
                    }
                }
            }
        }
        else {
            while (++i !== len) {
                // checks to see if the key was set
                if (i in this) {
                    kValue = t[i];
                    if (func.call(thisArg, t[i], i, t)) {
                        res[c++] = kValue;
                    }
                }
            }
        }

        res.length = c; // shrink down array to proper size
        return res;
    };
}

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: https://es5.github.io/#x15.4.4.19
if (!Array.prototype.map) {

    Array.prototype.map = function (callback/*, thisArg*/) {

        var T, A, k;

        if (this == null) {
            throw new TypeError('this is null or not defined');
        }

        // 1. Let O be the result of calling ToObject passing the |this|
        //    value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get internal
        //    method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: https://es5.github.com/#x9.11
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }

        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // 6. Let A be a new array created as if by the expression new Array(len)
        //    where Array is the standard built-in constructor with that name and
        //    len is the value of len.
        A = new Array(len);

        // 7. Let k be 0
        k = 0;

        // 8. Repeat, while k < len
        while (k < len) {

            var kValue, mappedValue;

            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty internal
            //    method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            if (k in O) {

                // i. Let kValue be the result of calling the Get internal
                //    method of O with argument Pk.
                kValue = O[k];

                // ii. Let mappedValue be the result of calling the Call internal
                //     method of callback with T as the this value and argument
                //     list containing kValue, k, and O.
                mappedValue = callback.call(T, kValue, k, O);

                // iii. Call the DefineOwnProperty internal method of A with arguments
                // Pk, Property Descriptor
                // { Value: mappedValue,
                //   Writable: true,
                //   Enumerable: true,
                //   Configurable: true },
                // and false.

                // In browsers that support Object.defineProperty, use the following:
                // Object.defineProperty(A, k, {
                //   value: mappedValue,
                //   writable: true,
                //   enumerable: true,
                //   configurable: true
                // });

                // For best browser support, use the following:
                A[k] = mappedValue;
            }
            // d. Increase k by 1.
            k++;
        }

        // 9. return A
        return A;
    };
}



namespace g {

    /*
                888     888      d8888 8888888b.   .d8888b.
                888     888     d88888 888   Y88b d88P  Y88b
                888     888    d88P888 888    888 Y88b.
                Y88b   d88P   d88P 888 888   d88P  "Y888b.
                 Y88b d88P   d88P  888 8888888P"      "Y88b.
                  Y88o88P   d88P   888 888 T88b         "888
                   Y888P   d8888888888 888  T88b  Y88b  d88P
                    Y8P   d88P     888 888   T88b  "Y8888P"
    */

    /**
     * System temp directory, resolved from %TEMP%
     * @type {string}
     */
    export const SYSTEMP: string = ''+DOpus.fsUtil().resolve('%TEMP%');


    /*
                 .d8888b.  888             d8888  .d8888b.   .d8888b.  8888888888  .d8888b.
                d88P  Y88b 888            d88888 d88P  Y88b d88P  Y88b 888        d88P  Y88b
                888    888 888           d88P888 Y88b.      Y88b.      888        Y88b.
                888        888          d88P 888  "Y888b.    "Y888b.   8888888     "Y888b.
                888        888         d88P  888     "Y88b.     "Y88b. 888            "Y88b.
                888    888 888        d88P   888       "888       "888 888              "888
                Y88b  d88P 888       d8888888888 Y88b  d88P Y88b  d88P 888        Y88b  d88P
                 "Y8888P"  88888888 d88P     888  "Y8888P"   "Y8888P"  8888888888  "Y8888P"
    */
    /**
     * Generic Result object
     * @param {any} okValue value on success
     * @param {any} errValue value on error/failure
     */
    export class Result<S, E> implements IResult<S, E> {
        ok   : S;
        err  : E;
        stack: Array<any>;
        constructor(oOKValue: S, oErrValue: E) {
            this.ok    = oOKValue;   // typeof oOKValue !== 'undefined' ? oOKValue : false;
            this.err   = oErrValue;  // typeof oErrValue!== 'undefined' ? oErrValue : true;
            this.stack = [];
        }
        // note this one does not allow any falsy value for OK at all
        isOk()     { return !!this.ok; }
        // note this one allows falsy values - '', 0, {}, []... - for OK - USE SPARINGLY
        isValid()  { return !this.err; }
        isErr()    { return !!this.err; }
        toString() { return JSON.stringify(this, null, 4); }
    }


    /*
                8888888888 888     888 888b    888  .d8888b. 88888888888 8888888  .d88888b.  888b    888  .d8888b.
                888        888     888 8888b   888 d88P  Y88b    888       888   d88P" "Y88b 8888b   888 d88P  Y88b
                888        888     888 88888b  888 888    888    888       888   888     888 88888b  888 Y88b.
                8888888    888     888 888Y88b 888 888           888       888   888     888 888Y88b 888  "Y888b.
                888        888     888 888 Y88b888 888           888       888   888     888 888 Y88b888     "Y88b.
                888        888     888 888  Y88888 888    888    888       888   888     888 888  Y88888       "888
                888        Y88b. .d88P 888   Y8888 Y88b  d88P    888       888   Y88b. .d88P 888   Y8888 Y88b  d88P
                888         "Y88888P"  888    Y888  "Y8888P"     888     8888888  "Y88888P"  888    Y888  "Y8888P"
    */
    /**
     * poor man's debugger
     * returns the given object in a printable fashion, incl. some of DOpus objects
     * @param {any} obj any object, tries to find out the type automatically
     * @param {boolean=} asPOJO if the output object should be returned as POJO or string
     * @returns {object|string}
     */
    export function dumpObject(obj: any, asPOJO?: boolean): { type: string; value: string; } {
        asPOJO = asPOJO || false;
        var out: any = {};
        out.type = typeof obj;
        // out.prototype = obj.prototype;
        out.value = '';
        switch (typeof obj) {
            case 'string':
            case 'number':
            case 'boolean':
            case 'bigint':
                out.value = obj; break;
            case 'undefined':
                out.value = 'undefined'; break;
            case 'function':
                out.value = obj.toString().slice(0, 100) + ' ...cropped for brevity'; break;
            // out.value = obj.toString(); break;
            case 'object':
                if (obj === null) { out.value = 'null'; break; }
                try {
                    if (doh.isValidDOItem(obj)) { out.value = 'DOpus Item - fullpath: ' + obj.realpath; break; }
                    else if (doh.isValidDOCommandData(obj)) { out.value = 'DOpus Command Data'; break; }
                    else if (doh.isValidDOColumnData(obj)) { out.value = 'DOpus Column Data'; break; }
                    else if (doh.isValidDOMap(obj)) { out.value = 'DOpus Map'; break; }
                    else if (doh.isValidDOVector(obj)) { out.value = 'DOpus Vector'; break; }
                    else if (doh.isValidDOEnumerable(obj)) { out.value = 'DOpus Enumerable'; break; }
                } catch (e) { /* TODO */ }
                try { JSON.parse(JSON.stringify(obj, null, 4)); out.value = obj; break; } catch (e) { /* TODO */ }

                try { out.value = obj.toString(); return out.value; } catch (e) { /* TODO */ }
                try { out.value = new RegExp(obj); return out.value; } catch (e) { /* TODO */ }
                out.value = 'undetermined object';
                break;
            default:
                out.value = 'unknown type';
        }
        // return asPOJO ? out : JSON.stringify(out, null, 4);
        return out;
    }

    /**
     * Not the most elegant solution, but JScript/JS does not easily allow to determine function name from a given function object.
     *
     * It cannot parse 'anonymous' methods, incl. exposed method names in singletons, e.g. funcNameExtractor(actions.getFunc).
     *
     * There is no debugger for DOpus user scripts, blame the universe not me.
     * @function funcNameExtractor
     * @param {function} fnFunc
     * @param {string=} parentName
     * @returns {string}
     * @throws {Error}
     */
    export function funcNameExtractor(fnFunc: Function, parentName?: string): string {
        let reExtractor = new RegExp(/^function\s+(\w+)\(.+/),
            fnName = 'funcNameExtractor',
            cache: Function[] = [];
        // @ts-ignore
        if (cache[fnFunc]) {
            // @ts-ignore
            return cache[fnFunc];
        }
        if (typeof fnFunc !== 'function') {
            abortWith(new Error(sprintf('%s -- Given parameter is not a function\n%s', fnName, dumpObject(fnFunc))));
        }
        var matches = fnFunc.toString().match(reExtractor),
            out = matches ? matches[1] : 'Anonymous -- ' + dumpObject(fnFunc, true).value.replace(/\n|^\s+|\s+$/mg, '');
        if (parentName)
            out = parentName + '.' + out;
        // @ts-ignore
        cache[fnFunc] = out;
        return out;
    }

    /**
     * wrapper for Result
     * @param {any=} okValue
     * @param {any=} addInfo
     * @returns {Result}
     */
    export function ResultOk(okValue?: any, addInfo?: any): IResult<typeof okValue, any> {
        // return new Result(okValue||true, false);
        // var res = okValue instanceof Result ? okValue : new Result(okValue||true, false);
        var res = okValue instanceof Result ? okValue : new Result(okValue !== undefined ? okValue : true, undefined);
        if (addInfo !== undefined)
            res.stack.push(addInfo);
        return res;
    }

    /**
     * wrapper for Result
     * @param {any=} errValue
     * @param {any=} addInfo
     * @returns {Result}
     */
    export function ResultErr(errValue?: any, addInfo?: any): Result<any, typeof errValue> {
        // return new Result(false, errValue||true);
        // var res = errValue instanceof Result ? errValue : new Result(false, errValue||true);
        var res = errValue instanceof Result ? errValue : new Result(undefined, errValue !== undefined ? errValue : true);
        if (addInfo !== undefined)
            res.stack.push(addInfo);
        return res;
    }

    export function now() {
        return new Date().getTime();
    }

    // /** @param {object} obj */
    // function getKeys(obj: { hasOwnProperty: (arg0: string) => any; }) {
    //     // I do not want to put this object.prototype for various reasons
    //     var out = [];
    //     for (var k in obj) {
    //         // eslint-disable-next-line no-prototype-builtins
    //         if (obj.hasOwnProperty(k)) out.push(k);
    //     }
    //     return out;
    // }

    /**
     * @param {Object.<string, any>} obj
     * @param {boolean=} descending
     * @returns {Object.<string, any>}
     */
    export function sortByKey(obj: { [x: string]: any; }, descending: boolean): { [s: string]: any; } {
        var unsorted = obj,
            sortHelper = [];
        for (var key in obj)
            sortHelper.push(key);
        sortHelper.sort(function (a, b) {
            return (a < b ? -1 : a > b ? 1 : 0) * (descending ? -1 : 1);
        });
        obj = {};
        for (var i = 0; i < sortHelper.length; i++) {
            obj[sortHelper[i]] = unsorted[sortHelper[i]];
        }
        return obj;
    }

    /**
     * @param {Object.<string, any>} obj
     * @param {string} field
     * @param {boolean=} descending
     * @returns {Object.<string, any>}
     */
    export function sortByValField(obj: { [x: string]: any; }, field: string | number, descending: any): { [s: string]: any; } {
        var unsorted = obj,
            sortHelper = [];
        for (var key in obj)
            sortHelper.push(obj[key][field]);
        sortHelper.sort(function (a, b) {
            return (a < b ? -1 : a > b ? 1 : 0) * (descending ? -1 : 1);
        });
        obj = {};
        for (var i = 0; i < sortHelper.length; i++) {
            obj[sortHelper[i]] = unsorted[sortHelper[i]];
        }
        return obj;
    }


    /**
     * Split the keys & values of given enum and returns as sorted arrays
     *
     * Given
     * ```typescript
     *   enum foo1 { key1, key2 }
     *   enum foo2 { key1 = 3, key2 = 2 }
     *   enum foo3 { key1 = 'val1', key2 = 'val2' }
     * ```
     *
     * An object with 2 parts are returned
     * ```typescript
     *   { keys: keyArray[], vals: valsArray[] }
     * ```
     *
     * Keys
     * ```typescript
     *   foo1 => [ key1, key2 ]
     *   foo2 => [ key1, key2 ]
     *   foo3 => [ key1, key2 ]
     * ```
     *
     * Vals
     * ```typescript
     *   foo1 => [ 0, 1 ]
     *   foo2 => [ 3, 2 ]
     *   foo3 => [ 'val1', 'val2' ]
     * ```
     *
     * @throws Exception when empty enum is passed
     *
     * @example
     *   // caller method
     *   public getKeys(): LOGLEVEL[] {
     *       return g.splitEnum(LOGLEVEL).keys as unknown as LOGLEVEL[];
     *   }
     * @param enumObject enum object, **must** be non-empty
     * @returns Object.<keys: keyof typeof enumObject[], vals: typeof enumObject[]>
     */
    export function splitEnum(enumObject: any): { keys: keyof typeof enumObject[], vals: typeof enumObject[]} {
        // from https://github.com/Microsoft/TypeScript/issues/17198#issuecomment-315400819
        // combined with type conversion (from standard string to Enum[])
        // it's not the most elegant solution
        // but it tries hard to prevent passing an enum to one of the explicitly-typed splitEnum methods below
        // which I commented out but kept for later reference
        //
        // first try the number-valued enums e.g. enum foo1 { key1, key2 };
        var keys: typeof enumObject[] = Object.keys(enumObject).filter(k => typeof enumObject[k as any] === 'number');
        if (!keys.length) {
            // we failed, try the string-valued enums e.g. enum foo2 { key1 = 'val1', key2 = 'val2' };
            keys = Object.keys(enumObject).filter(k => typeof enumObject[k as any] === 'string');
        }
        if (!keys.length) {
            throw new Error('splitEnum(): empty or unknown enum passed, cannot continue!');
        }
        const vals = keys.map(k => enumObject[k as any]);
        // @ts-ignore
        return { keys: keys, vals: vals};
    }
    export function getEnumKeys(enumObject: any): keyof typeof enumObject[] {
        return splitEnum(enumObject).keys;
    }
    export function getEnumVals(enumObject: any): number[] {
        return splitEnum(enumObject).vals;
    }
    export function findIndexOfValue(enumObject: any, value: any): IResult<number, true> {
        const keys = splitEnum(enumObject).keys as unknown as string[];
        for (let i = 0; i < keys.length; i++) {
            const val = keys[i];
            if (value === enumObject[val]) {
                return ResultOk(i);
            }
        }
        return ResultErr(true);
    }

    // export function splitEnum(enumObject: any): { keys: keyof typeof enumObject[], vals: typeof enumObject[]} {
    //     // from https://github.com/Microsoft/TypeScript/issues/17198#issuecomment-315400819
    //     // combined with type conversion (from standard string to Enum[])
    //     // it's not the most elegant solution
    //     // but it tries hard to prevent passing an enum to one of the explicitly-typed splitEnum methods below
    //     // which I commented out but kept for later reference
    //     var keysUnknown: unknown, keys: typeof enumObject[];
    //     // first try the number-valued enums e.g. enum foo { key1, key2 };
    //     keysUnknown = Object.keys(enumObject).filter(k => typeof enumObject[k as any] === 'number');
    //     keys        = <typeof enumObject[]> keysUnknown;
    //     if (!keys.length) {
    //         // we failed, try the string-valued enums e.g. enum foo { key1 = 'val1', key2 = 'val2' };
    //         keysUnknown = Object.keys(enumObject).filter(k => typeof enumObject[k as any] === 'string');
    //         keys        = <typeof enumObject[]> keysUnknown;
    //     }
    //     if (!keys.length) {
    //         throw new Error('splitEnum(): empty or unknown enum passed, cannot continue!');
    //     }
    //     const vals = keys.map(k => enumObject[k as any]);
    //     // @ts-ignore
    //     return { keys: keys, vals: vals};
    // }
    // export function getEnumKeys(enumObject: any): keyof typeof enumObject[] {
    //     return splitEnum(enumObject).keys;
    // }
    // export function getEnumVals(enumObject: any): number[] {
    //     return splitEnum(enumObject).vals;
    // }

    /*
    export function splitStringBasedEnum(enumObject: any): { keys: keyof typeof enumObject[], vals: string[]} {
        // from https://github.com/Microsoft/TypeScript/issues/17198#issuecomment-315400819
        // combined with type conversion (from standard string to Enum[])
        const keysUnknown: unknown = Object.keys(enumObject).filter(k => typeof enumObject[k as string] === 'string');
        const keys: typeof enumObject[] = <typeof enumObject[]> keysUnknown;
        const vals = keys.map(k => enumObject[k as any]);
        // @ts-ignore
        return { keys: keys, vals: vals};
    }
    export function getStringBasedEnumKeys(enumObject: any): keyof typeof enumObject[] {
        return splitStringBasedEnum(enumObject).keys;
    }
    export function getStringBasedEnumVals(enumObject: any): string[] {
        return splitStringBasedEnum(enumObject).vals;
    }


    export function splitNumberBasedEnum(enumObject: any): { keys: keyof typeof enumObject[], vals: number[]} {
        // from https://github.com/Microsoft/TypeScript/issues/17198#issuecomment-315400819
        // combined with type conversion (from standard string to Enum[])
        const keysUnknown: unknown = Object.keys(enumObject).filter(k => typeof enumObject[k as any] === 'number');
        const keys: typeof enumObject[] = <typeof enumObject[]> keysUnknown;
        const vals = keys.map(k => enumObject[k as any]);
        // @ts-ignore
        return { keys: keys, vals: vals};
    }
    export function getNumberBasedEnumKeys(enumObject: any): keyof typeof enumObject[] {
        return splitNumberBasedEnum(enumObject).keys;
    }
    export function getNumberBasedEnumVals(enumObject: any): number[] {
        return splitNumberBasedEnum(enumObject).vals;
    }
    */

    /**
     * Show a message dialog with message and optional title & buttons
     * @param {DOpusDialog|null} dialog
     * @param {string} msg
     * @param {string=} title
     * @param {string=} buttons e.g. 'OK', 'OK|CANCEL'...
     * @returns {number} number of button the user clicked 1, 2, 3... 0 if cancelled
     */
    export function showMessageDialog(dialog: DOpusDialog | null, msg: string, title?: string | undefined, buttons?: string | undefined): number {
        var dlgConfirm = dialog || doh.dlg();
        dlgConfirm.message = msg;
        dlgConfirm.title = title || '';
        dlgConfirm.buttons = buttons || 'OK';
        var ret = dlgConfirm.show();
        return ret;
    }

    /**
     * Helper method to show an exception to the user before throwing it,
     * the exception must be still caught and handled.
     * @param {Error} oErr
     * @throws {Error}
     */
    export function abortWith(oErr: Error) {
        // memory.clearCache();
        var err = oErr.name + ' occurred in ' + oErr.where + ':\n\n' + oErr.message;
        DOpus.output('');
        DOpus.output('');
        DOpus.output('');
        DOpus.output('');
        DOpus.output(err);
        showMessageDialog(null, err);
        throw oErr;
    }

    export function getUniqueID(simple = true):string {
        // Believe it or not
        // on a fast CPU, if this method and random() method are called very frequently
        // the milliseconds we get from now() from 2 successive calls are usually the same
        // and random(), although rarely but not never, returns the same value twice
        // in the very exact milliseconds!
        // Using DOpus.delay(1) unfortunately did not help, because I suspect,
        // once DOpus executes delay() the OS sends the script to a much longer sleep
        // than we intend, only 1 millisecs.
        // The md5 calculation keeps the CPU just enough occupied
        // to make it wait longer than 1 ms, so that the generated number is guaranteed to be unique.
        var _now = now();
        if (simple) {
            // now() + '_' + Math.floor(1000 + Math.random() * 8999);
            return _now.toString();
        }
        var blob = DOpus.create().blob();
        blob.copyFrom('' + _now + Math.floor(1000000000 + Math.random() * 8999999999));
        var _nowMD5 = DOpus.fsUtil().hash(blob, 'md5');
        return _nowMD5.toString();
    }

}



namespace g {
    // this namespace  wraps the sprintf.js as a TS namespace
    // it's possible thanks to the genius solution from https://stackoverflow.com/a/54946767
    const wrap = <T extends Array<any>, U>(fn: (...args: T) => U) => {
        return (...args: T): U => fn(...args)
    }
    /**
     *
     * The placeholders in the format string are marked by % and are followed by one or more of these elements, in this order:
     *
     * An optional number followed by a $ sign that selects which argument index to use for the value. If not specified, arguments will be placed in the same order as the placeholders in the input string.
     *
     * An optional + sign that forces to precede the result with a plus or minus sign on numeric values. By default, only the - sign is used on negative numbers.
     *
     * An optional padding specifier that says what character to use for padding (if specified). Possible values are 0 or any other character preceded by a ' (single quote). The default is to pad with spaces.
     *
     * An optional - sign, that causes sprintf to left-align the result of this placeholder. The default is to right-align the result.
     *
     * An optional number, that says how many characters the result should have. If the value to be returned is shorter than this number, the result will be padded. When used with the j (JSON) type specifier, the padding length specifies the tab size used for indentation.
     *
     * An optional precision modifier, consisting of a . (dot) followed by a number, that says how many digits should be displayed for floating point numbers. When used with the g type specifier, it specifies the number of significant digits. When used on a string, it causes the result to be truncated.
     *
     * A type specifier that can be any of:
     *
     *  * **%** — yields a literal % character
     *  * **b** — yields an integer as a binary number
     *  * **c** — yields an integer as the character with that ASCII value
     *  * **d** or i — yields an integer as a signed decimal number
     *  * **e** — yields a float using scientific notation
     *  * **u** — yields an integer as an unsigned decimal number
     *  * **f** — yields a float as is; see notes on precision above
     *  * **g** — yields a float as is; see notes on precision above
     *  * **o** — yields an integer as an octal number
     *  * **s** — yields a string as is
     *  * **t** — yields true or false
     *  * **T** — yields the type of the argument1
     *  * **v** — yields the primitive value of the specified argument
     *  * **x** — yields an integer as a hexadecimal number (lower-case)
     *  * **X** — yields an integer as a hexadecimal number (upper-case)
     *  * **j** — yields a JavaScript object or array as a JSON encoded string
     * @param {string} key formatting string
     * @param {...any} arguments multiple arguments
     * @returns string
     */
    export const sprintf: Function = wrap(sprintfjs.sprintf);

    // not used at the moment
    // export const vsprintf: Function = wrap(sprintfjs.vsprintf);
    // export const sprintf_format: Function = wrap(sprintfjs.sprintf_format);
    // export const sprintf_parse: Function  = wrap(sprintfjs.sprintf_parse);
}
