// @ts-check
/* global ActiveXObject Enumerator DOpus Script */
///<reference path='./_DOpusDefinitions.d.ts' />
///<reference path='./libSprintf.js' />


/**
 * # What is this file?
 *
 * This library is, as the name implies, the standard development library and
 * **the heart** of all my personal DOpus/TypeScript developments.
 *
 * It supplies all the basic methods, constants, some crucial yet missing methods in JScript
 * such as String.trim() or Object.keys() and tries to dictate the library construction and
 * error strategy.
 *
 * As can be seen above, it automatically includes DOpus interface definitions and
 * declares global WSH variables DOpus, ActiveXObject etc.
 *
 * Except the fundamental interfaces, ex enum & UserExc method for the exceptions,
 * everything is wrapped in the `namespace g`.
 *
 * ## Implementing a Library
 *
 * All libraries should have this at the top of the file:
 * ```typescript
 *   ///<reference path='../std/libStdDev.ts' />
 * ```
 *
 * Also all library classes should at the very least implement the interface **`ILibrary`**.
 *
 *
 * ## Error strategy:
 *
 * Principally there are no `throw new Exception/Error`s except in the polyfills or external libs,
 * i.e. pure JavaScript portions of this file.
 *
 * All TypeScript methods I write return an IException object wrapped in an IResult object.
 *
 * This helps to overcome a few problems, both for development and user experience.
 *
 * See the interface IResult for in-depth explanation.
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

interface Function {
    fname: string;
}


/**
 * Showable errors, mainly for Results and Exceptions
 */
interface IShowableError<T> {
    /** should show if this is an error and return the same object */
    show(): T;
}


/**
 * # IResult
 *
 * Cheap, Rust-like Result object.
 * It semi-enforces you to unpack the results of method calls which might return an error/exception.
 *
 * # Philosophy behind IResult:
 *
 *
 * A typical 'throw' can easily cut through the whole callstack and break the script abruptly,
 * unless there are multiple try/catch all the way to the top level.
 *
 * JS/TS have no checked exceptions, as in Java, which explicitly warns about possible exceptions.
 * And neither Visual Studio Code (VSC) nor ESLint can warn about this either, i.e. the method you
 * call would throw an exception and which kind. You have to look into the code.
 *
 * In a highly-generic language like JS, even with TypeScript additions, this spells disaster,
 * because the visible contract of the method signature is only the tip of the iceberg. Any method
 * can throw an exception at any time.
 *
 * Put together, this means if the developer forgets to put try/catch blocks at every single step
 * of all possible callchains, eventually a script might abort prematurely and
 * leave the system in an unstable state. In the case of DOpus, an unstable state
 * might cause file loss, messed up file timestamps, and so on.
 *
 *
 * ...But it gets worse:
 * JScript lacks "(call)stack" in errors and there is no JScript/WSH debugger we can use in DOpus.
 *
 * These 2 have serious implications, as if the unchecked exceptions weren't enough:
 *
 *  * Errors can be traced to the place where they really occurred but not which caller provoked it.
 *  * To show a meaningful error, the exception raiser must gather all necessary info,
 *    if it has that info at all, which would normally be in the call stack and put them into the exception.
 *
 * This makes ambitious developments nearly impossible and would leave plugins as the only alternative.
 *
 * This forced me to get inspirations from error-code based languages a la C and functional languages,
 * but especially Rust's Result and the following article:
 *
 * http://joeduffyblog.com/2016/02/07/the-error-model/
 *
 * *(Highly recommended read if you're a professional or ambitioned developer,
 * gives a tremendous overview of how different languages handle errors and has many useful links)*
 *
 * Unlike in the article, I chose not to abandon the script on thrown exceptions,
 * but enforce myself to check the results of method calls by wrapping the errors in a *Result* object.
 *
 * # How to use:
 *
 * The Result objects cannot be consumed directly, e.g. `DOpus.output(fs.readFile(somefile))` will not work,
 * Instead Results must be checked first, as in the following:
 * ```typescript
 *   var resRead = fs.readFile(somefile);
 *   // now use one of the .isOk(), .isErr(), .match() etc. methods
 *   if (resRead.isErr()) {
 *     // do something
 *     return res;
 *   }
 *   DOpus.output('file contents:\n' + res.ok);
 *
 *   // or something like this
 *   resRead.match({
 *     ok:  (ok)  => { DOpus.output('file contents:\n' + res.ok); }
 *     err: (err) => { DOpus.output('Error occurred!\n' + res.err); }
 *   })
 * ```
 *
 * This does not prevent one from ignoring the error case and trying to use .ok value but
 * helps at the calling site by reminding that the call **might** return an error!
 *
 *
 * Unlike other implementations, my IResult has additional methods:
 *
 *   * match(): another inspiration from Rust, as seen above
 *   * show(): can be used to show a DOpus dialog to the user, before re-returning the result's this object, e.g.
 *
 * ```typescript
 *   var resRead = fs.readFile(somefile);
 *   if (resRead.isErr()) {
 *     return res.show(); // shows a dialog only if it's an error
 *   }
 *   // proceed with Ok case.
 *   return res.show(); // this would show no dialog, since it's not an error
 * ```
 *
 * Other Rust macros/functions like `unwrap()`, `expect()` are **intentionally not implemented**,
 * in order not to give the developer any shortcut to ok values,
 * which would throw an exception if the result is an error instead.
 * Avoiding unchecked exceptions is the key here.
 *
 *
 * My implementation is a very cheap knock-off of Rust's Result. Apparently many others had the same idea:
 *   * https://github.com/vultix/ts-results
 *   * https://github.com/theroyalwhee0/result
 *   * https://github.com/hqoss/monads
 *   * https://github.com/karen-irc/option-t
 *
 * These are more or less compatible with my implementation as well. Replace if you fancy.
 */
interface IResult<S, E> extends IShowableError<IResult<S, E>> {
    ok: S;
    err: E;
    stack: Array<any>;
    isOk(): boolean;
    // isValid(): boolean;
    isErr(): boolean;
    toString(): string;
    match(matcher: IResultMatcher): any;
}
declare var IResult: {
    new (success: any, error: any): IResult<typeof success, typeof error>;
}
/**
 * Helper structure for Result
 */
interface IResultMatcher {
    /** function to execute if result is ok */
    ok: Function,
    /** function to execute if result is error */
    err: Function
}

/**
 * Standard logger interface.
 *
 * Implemented in libLogger.ts.
 */
interface ILogger extends IShowableError<string> {
    getLevel()                  : g.LOGLEVEL;
    setLevel(level: g.LOGLEVEL) : void;
    getLevels()                 : g.LOGLEVEL[];
    getLevelIndex()             : IResult<number, boolean>;
    force(message?: string)     : void;
    none(message?: string)      : void;
    error(message?: string)     : void;
    warn(message?: string)      : void;
    normal(message?: string)    : void;
    info(message?: string)      : void;
    verbose(message?: string)   : void;
    sforce(...args: any)        : void;
    snone(...args: any)         : void;
    serror(...args: any)        : void;
    swarn(...args: any)         : void;
    snormal(...args: any)       : void;
    sinfo(...args: any)         : void;
    sverbose(...args: any)      : void;
}

/**
 * All library classes MUST implement this interface!
 */
interface ILibrary {
    /**
     * Injects a custom logger, instead of the default one.
     * @param newLogger new logger to override the default
     */
    setLogger(newLogger: ILogger): IResult<boolean, boolean>;
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
 * @param {function} fnCaller
 * @param {string} message
 * @param {string|function} where
 * @constructor
 */
interface IException<T> extends IShowableError<IException<T>> {
    /** Internal type number, never use it directly/hard-coded */
    readonly type: T;
    /** Exception name, e.g. 'NotImplementedYetException' */
    readonly name: string;
    /** Message from the exception raiser */
    readonly message: string;
    /** Where the exception has occurred; this is not automatically set, i.e. it's up to the raiser to set this correctly */
    readonly where: string;
}

function Exc(type: ex, where: string | Function, message?: string): IResult<any, IException<ex>> {
    return new g.Result(false, new g.UserException(type, where, message));
}

enum ex {
    /** Method/function not implemented yet */
    NotImplementedYet,
    /** Requirements have not been initialized yet  */
    Uninitialized,
    /** The dev made a stupid mistake, it's a bug that should have been caught */
    DeveloperStupidity,
    /** MTH Manager does not recognize given command */
    InvalidManagerCommand,
    /** Given string is not valid JSON */
    InvalidJSON,
    /** Given parameter type does not match expected type */
    InvalidParameterType,
    /** Given parameter value is not accepted */
    InvalidParameterValue,
    /** Requested key does not exist in the object */
    InvalidKey,
    /** Errors while reading from or writing into ADS stream */
    StreamReadWrite,
    /** File could not be created */
    FileCreate,
    /** File could not be read */
    FileRead,


    InvalidFormat,
    UnsupportedFormat,
    ThreadPoolMiss,
    InvalidNumber,
    UserAborted,
    SanityCheckFail,
    KeyAlreadyExists,
    KeyDoesNotExist,
    InvalidUserParameter,
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
    asInt(): IResult<number, IException<ex>>;

    normalizeLeadingWhiteSpace(): string;
    substituteVars(): string;

    toHash(): string;
}

// methods for pseudo-HEREDOCs
String.prototype.normalizeLeadingWhiteSpace = function () {
    // the §s help to avoid backtracking
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
String.prototype.asInt = function () : IResult<number, IException<ex>> {
    var num = parseInt(this.valueOf(), 10);
    if (isNaN(num)) {
        return Exc(ex.InvalidNumber, 'asInt', 'This string cannot be parsed as a number: ' + this.valueOf());
    }
    return g.ResultOk(num);
};

String.prototype.toHash = function () : string {
    let blob = DOpus.create().blob();
    blob.copyFrom(this.valueOf());
    return <string> DOpus.fsUtil().hash(blob, 'md5');
};




/*
    8888888b.   .d88888b.  888    Y88b   d88P 8888888888 8888888 888      888      .d8888b.
    888   Y88b d88P" "Y88b 888     Y88b d88P  888          888   888      888     d88P  Y88b
    888    888 888     888 888      Y88o88P   888          888   888      888     Y88b.
    888   d88P 888     888 888       Y888P    8888888      888   888      888      "Y888b.
    8888888P"  888     888 888        888     888          888   888      888         "Y88b.
    888        888     888 888        888     888          888   888      888           "888
    888        Y88b. .d88P 888        888     888          888   888      888     Y88b  d88P
    888         "Y88888P"  88888888   888     888        8888888 88888888 88888888 "Y8888P"
*/

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
        } else {
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


// see https://www.typescriptlang.org/docs/handbook/namespaces-and-modules.html
namespace g {

    interface ScriptMetaKnown {
        COPYRIGHT?     : string,
        DEFAULT_ENABLE?: boolean,
        DESC?          : string,
        EARLY_DBLCLK?  : boolean,
        GROUP?         : string,
        LOG_PREFIX?    : string,
        MIN_VERSION?   : string,
        NAME?          : string,
        URL?           : string,
        VERSION?       : string,
    }
    export interface ScriptMeta extends ScriptMetaKnown {
        [key: string]: any;
    }


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


    // export const dop        = DOpus;
    // export const scr        = Script;
    // export const dc         = DOpus.create();
    export const cmd        = DOpus.create().command();
    export const st         = DOpus.create().stringTools();
    export const fsu        = DOpus.fsUtil();
    // export const dv         = DOpus.vars;
    // export const sv         = Script.vars;
    export const shell      = new ActiveXObject('WScript.shell');
    export const dopusrt    = 'dopusrt /acmd';


    export enum ERROR_MODES {
        ONLY_EXCEPTIONS = 'ONLY_EXCEPTIONS',
        ALL_RESULTS = 'ALL_RESULTS',
    }

    export var ERROR_MODE:ERROR_MODES = ERROR_MODES.ONLY_EXCEPTIONS;

    export enum LOGLEVEL {
        FORCE   = -1,
        NONE    = 0,
        ERROR   = 1,
        WARN    = 2,
        NORMAL  = 3,
        INFO    = 4,
        VERBOSE = 5
    }

    export enum VAR_NAMES {
        SCRIPT_UNIQUE_ID    = 'SCRIPT_UNIQUE_ID',
        SCRIPT_FILE_PATH    = 'SCRIPT_FILE_PATH',
        SCRIPT_CONFIG_DUMP  = 'SCRIPT_CONFIG_DUMP',
        SCRIPT_FNAME_CACHE  = 'SCRIPT_FNAME_CACHE',
    }

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
     * System temp directory, resolved from *%TEMP%*
     * @type {string}
     */
    export const SYSTEMP: string    = ''+DOpus.fsUtil().resolve('%TEMP%');
    /**
     * DOpus scripts directory, resolved from *dopusdata/Script AddIns* -- has a trailing backslash
     * @type {string}
     */
    export const SCRIPTSDIR: string = DOpus.fsUtil().resolve('/dopusdata/Script AddIns') + '\\';

    /**
     * Unique script ID for memory operations via DOpus.vars, Script.Vars and alike
     * @type {string}
     */
    export let SCRIPT_UNIQUE_ID: string;

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
            this.ok    = oOKValue;
            this.err   = oErrValue;
            this.stack = [];
        }
        // note this one does not allow any falsy value for OK at all
        // isOk()     { return !!this.ok; }
        isOk()     { return typeof this.ok !== 'undefined'; }
        // note this one allows falsy values - '', 0, {}, []... - for OK - USE SPARINGLY
        // isValid()  { return !this.err; }
        // isErr()    { return !!this.err; }
        isErr()    { return typeof this.err !== 'undefined'; }
        toString() { return JSON.stringify(this, null, 4); }
        toExString() {
            return (this.err as unknown as UserException).toString();
        }
        match(matcher: IResultMatcher) {
            if(this.isOk()) {
                return matcher.ok.apply(matcher.ok);
            } else {
                return matcher.err.apply(matcher.err);
            }
        }
        show(): IResult<S, E> {
            if (!this.isErr()) {
                return this;
            }
            // non-exception results are not shown, unless ALL_RESULTS is set
            if (ERROR_MODE !== ERROR_MODES.ALL_RESULTS && !(this.err instanceof UserException)) {
                logger.error(this.toString());
                return this;
            }
            const err = this.err instanceof UserException ? this.err.toString() : this.toString();
            logger.error(err);
            g.showMessageDialog(null, err);
            return this;
        }
    }

    export class UserException implements IException<ex>, IShowableError<UserException> {
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
        toString(): string {
            return this.name + ' (' + this.type + ') @ ' + this.where + '\n\n' + this.message;
        }
        show(): UserException {
            g.showMessageDialog(null, this.toString());
            return this;
        }
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

    export function init(initData: DOpusScriptInitData, scriptMeta?: ScriptMeta) {
        initData.vars.set(VAR_NAMES.SCRIPT_FILE_PATH, initData.file);
        initData.vars.set(VAR_NAMES.SCRIPT_UNIQUE_ID, initData.file.toHash());
        if (scriptMeta) {
            initData.name           = scriptMeta.NAME           || '';
            initData.version        = scriptMeta.VERSION        || '';
            initData.copyright      = scriptMeta.COPYRIGHT      || '';
            initData.url            = scriptMeta.URL            || '';
            initData.desc           = scriptMeta.DESC           || '';
            initData.min_version    = scriptMeta.MIN_VERSION    || '';
            initData.group          = scriptMeta.GROUP          || '';
            initData.log_prefix     = scriptMeta.LOG_PREFIX     || '';
            initData.default_enable = scriptMeta.DEFAULT_ENABLE || true;
            initData.early_dblclk   = scriptMeta.EARLY_DBLCLK   || false;
        }
    }
    export function getScriptPathVars(): IResult<{ fullpath: string; path: string; isOSP: boolean; }, IException<ex>> {
        if (!Script.vars.exists(VAR_NAMES.SCRIPT_FILE_PATH)) {
            return Exc(ex.Uninitialized, 'g.getScriptPathVars', 'InitData has not been set yet, call g.init(scriptInitData) in your OnInit() first').show();
        }
        const oThisScriptsPath = DOpus.fsUtil().getItem(Script.vars.get(VAR_NAMES.SCRIPT_FILE_PATH));
        return g.ResultOk({
            fullpath: (''+oThisScriptsPath.realpath),
            path    : (''+oThisScriptsPath.path).normalizeTrailingBackslashes(),
            isOSP   : (''+oThisScriptsPath.ext).toLowerCase() === '.osp'
        });
    }
    export function getScriptUniqueID(): IResult<string, IException<ex>> {
        if (!Script.vars.exists(VAR_NAMES.SCRIPT_UNIQUE_ID)) {
            return Exc(ex.Uninitialized, 'g.getScriptPathVars', 'InitData has not been set yet, call g.init(scriptInitData) in your OnInit() first').show();
        }
        return g.ResultOk(Script.vars.get(VAR_NAMES.SCRIPT_UNIQUE_ID));
    }

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
                    if (isValidDOItem(obj)) { out.value = 'DOpus Item - fullpath: ' + obj.realpath; break; }
                    else if (isValidDOCommandData(obj)) { out.value = 'DOpus Command Data'; break; }
                    else if (isValidDOColumnData(obj)) { out.value = 'DOpus Column Data'; break; }
                    else if (isValidDOMap(obj)) { out.value = 'DOpus Map'; break; }
                    else if (isValidDOVector(obj)) { out.value = 'DOpus Vector'; break; }
                    else if (isValidDOEnumerable(obj)) { out.value = 'DOpus Enumerable'; break; }
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
     *
     * @function funcNameExtractor
     * @param {function} fnFunc function to get the name of
     * @param {string=} parentName prefix the function name with the parent name, for singletons & some nested classes.
     * @param {boolean=false} suppressWarning only for script initialization phase, during which fname's cannot be extracted
     * @returns {string}
     */
    export function funcNameExtractor(fnFunc: Function, parentName?: string, suppressWarning = false): string {
        const fname = 'funcNameExtractor';

        if (typeof fnFunc !== 'function') {
            abortWith(Exc(ex.DeveloperStupidity, fname,  'Given parameter is not a function\n' + dumpObject(fnFunc)).err);
        }
        if (typeof fnFunc.fname === 'undefined' && suppressWarning !== true) {
            Exc(ex.NotImplementedYet, 'funcNameExtractor', 'given method has not set the property \'fname\' yet, found: ' + fnFunc.fname + ',source:\n' + fnFunc.toString().slice(0,200) + '...').show();
        }
        if (fnFunc.fname) {
            return fnFunc.fname;
        }

        let reExtractor = new RegExp(/^function\s+(\w+)\(.+/),
            fnName = 'funcNameExtractor',
            cache: Function[] = [];
        // @ts-ignore
        if (cache[fnFunc]) {
            // @ts-ignore
            logger.sforce('%s -- found in cache: %s', fnName, cache[fnFunc]);
            // @ts-ignore
            return cache[fnFunc];
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
        var res = okValue instanceof Result ? okValue : new Result(okValue !== undefined ? okValue : true, undefined);
        if (addInfo !== undefined && okValue instanceof Result) {
            res.stack.push([okValue.ok, addInfo]);
        } else if (addInfo !== undefined) {
            res.stack.push(addInfo);
        } else if (okValue instanceof Result) {
            res.stack.push( okValue.ok);
        }
        return res;
    }

    /**
     * wrapper for Result
     * @param {any=} errValue
     * @param {any=} addInfo
     * @returns {Result}
     */
    export function ResultErr(errValue?: any, addInfo?: any): Result<any, typeof errValue> {
        var res = errValue instanceof Result ? errValue : new Result(undefined, errValue !== undefined ? errValue : true);
        if (addInfo !== undefined && errValue instanceof Result) {
            res.stack.push([errValue.err, addInfo]);
        } else if (addInfo !== undefined) {
            res.stack.push(addInfo);
        } else if (errValue instanceof Result) {
            res.stack.push( errValue.err);
        }
        return res;
    }

    export function now() {
        return new Date().getTime();
    }

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
        // but it is better than having separately typed methods and accidentally using the wrong one
        //
        // first try the number-valued enums e.g. enum foo1 { key1, key2 };
        var keys: typeof enumObject[] = Object.keys(enumObject).filter(k => typeof enumObject[k as any] === 'number');
        if (!keys.length) {
            // we failed, try the string-valued enums e.g. enum foo2 { key1 = 'val1', key2 = 'val2' };
            keys = Object.keys(enumObject).filter(k => typeof enumObject[k as any] === 'string');
        }
        if (!keys.length) {
            abortWith(Exc(ex.DeveloperStupidity, 'splitEnum()', 'empty or unknown enum passed, cannot continue!').err);
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


    /**
     * Show a message dialog with message and optional title & buttons
     * @param {DOpusDialog|null} dialog
     * @param {string} msg
     * @param {string=} title
     * @param {string=} buttons e.g. 'OK', 'OK|CANCEL'...
     * @returns {number} number of button the user clicked 1, 2, 3... 0 if cancelled
     */
    export function showMessageDialog(dialog: DOpusDialog | null, msg: string, title?: string | undefined, buttons?: string | undefined): number {
        var dlgConfirm = dialog || DOpus.dlg();
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
        var err = oErr.name + ' error occurred in ' + oErr.where + ':\n\n' + oErr.message;
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

// moved from DOpusHelpers
namespace g {
    /** Shortcut for DOpus.output() @param {any} string */
    export function out (string: any) {
        DOpus.output(string);
    }
    /** DOpus.ClearOutput wrapper */
    export function clear () {
        DOpus.clearOutput();
    }
    /** DOpus.Delay wrapper @param {number} millisecs to sleep */
    export function delay (millisecs: number) {
        if (!millisecs) return;
        DOpus.delay(millisecs);
    }
    /** DOpus.dlg() wrapper @returns {DOpusDialog} */
    export function dlg () {
        return DOpus.dlg();
    }
    /**
     * util.fu.GetItem wrapper
     * @param {string} sPath file full path
     * @returns {DOpusItem} DOpus Item
     */
    export function getItem (path: string): DOpusItem {
        return DOpus.fsUtil().getItem(path);
    }
    /**
     * @param {DOpusItem} oItem DOpus Item
     * @returns {boolean} true if DOpus item
     */
    export function isValidDOItem (oItem: DOpusItem): boolean {
        return (typeof oItem === 'object' && typeof oItem.realpath !== 'undefined' && typeof oItem.modify !== 'undefined');
    }
    /**
     * @param {DOpusItem} oItem DOpus Item
     * @returns {boolean} true if DOpus file, false if dir, reparse, junction, symlink
     */
    export function isFile (oItem: DOpusItem): boolean {
        // return (typeof oItem === 'object' && oItem.realpath && !oItem.is_dir && !oItem.is_reparse && !oItem.is_junction && !oItem.is_symlink);
        return (isValidDOItem(oItem) && !oItem.is_dir);
    }
    /**
     * @param {DOpusItem} oItem DOpus Item
     * @returns {boolean} true if DOpus directory, false if file, reparse, junction, symlink
     */
    export function isDir (oItem: DOpusItem): boolean {
        // return (typeof oItem === 'object' && typeof oItem.realpath !== 'undefined' && oItem.is_dir === true);
        return (isValidDOItem(oItem) && oItem.is_dir);
    }
    /**
     * @param {DOpusItem} oItem DOpus Item
     * @returns {boolean} true if DOpus file or directory, false if reparse, junction, symlink
     */
    export function isDirOrFile (oItem: DOpusItem): boolean {
        // return (typeof oItem === 'object' && oItem.realpath && !oItem.is_reparse && !oItem.is_junction && !oItem.is_symlink);
        return (isValidDOItem(oItem) && (!oItem.is_reparse && !oItem.is_junction && !oItem.is_symlink));
    }
    /**
     * @param {DOpusMap} oMap DOpus Map
     * @returns {boolean} true if DOpus Map
     */
        export function isValidDOMap (oMap: DOpusMap): boolean {
        return (typeof oMap === 'object' && typeof oMap.size === 'undefined' && typeof oMap.count !== 'undefined' && typeof oMap.length !== 'undefined' && oMap.count === oMap.length);
    }
    /**
     * @param {DOpusVector} oVector DOpus Vector
     * @returns {boolean} true if DOpus Vector
     */
    export function isValidDOVector (oVector: DOpusVector<any>): boolean {
        return (typeof oVector === 'object' && typeof oVector.capacity !== 'undefined' && typeof oVector.count !== 'undefined' && typeof oVector.length !== 'undefined' && oVector.count === oVector.length);
    }
    /**
     * @param {object} oAny any enumerable object, e.g. scriptCmdData.func.sourcetab.selected
     * @returns {boolean}
     */
    export function isValidDOEnumerable (oAny: object): boolean {
        try {
            var e = new Enumerator(oAny);
            return (e && typeof e.atEnd === 'function' && typeof e.moveNext === 'function');
        } catch(e) { return false; }
    }
    /**
     * @param {DOpusScriptCommandData} cmdData
     * @returns {boolean} true if DOpus command data
     */
    export function isValidDOCommandData (cmdData: DOpusScriptCommandData): boolean {
        return (cmdData.func && typeof cmdData.func.dlg === 'function');
    }
    /**
     * @param {DOpusScriptColumnData} oColData DOpus column data
     * @returns {boolean} true if DOpus column data
     */
    export function isValidDOColumnData (oColData: DOpusScriptColumnData): boolean {
        return (typeof oColData === 'object' && typeof oColData.value !== 'undefined' && typeof oColData.group !== 'undefined');
    }
    /** gets global (DOpus.Vars) var @param {any} key */
    export function getGlobalVar(key: any) {
        return DOpus.vars.get(key);
    }
    /** sets global (DOpus.Vars) var @param {any} key @param {any} val */
    export function setGlobalVar(key: any, val: any) {
        DOpus.vars.set(key, val);
    }
    /** @param {string} resourceName */
    export function loadResources(resourceName: string) {
        Script.loadResources(resourceName);
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
