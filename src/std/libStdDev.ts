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
    ok: S|false;
    err: E|true;
    stack: Array<any>;
    isOk(): boolean;
    isValid(): boolean;
    isErr(): boolean;
}

interface String {
    trim(): string;
}

interface Error {
    where: string;
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

    // self-explanatory
    // var SYSTEMP = '%TEMP%';
    // SYSTEMP = (''+doh.shell.ExpandEnvironmentStrings(SYSTEMP));
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
        ok   : S|false;
        err  : E|true;
        stack: any[];
        constructor(oOKValue: S, oErrValue: E) {
            this.ok    = typeof oOKValue !== 'undefined' ? oOKValue : false;
            this.err   = typeof oErrValue!== 'undefined' ? oErrValue : true;
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
    export function ResultOk(okValue?: any, addInfo?: any): Result<any, any> {
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
    export function ResultErr(errValue?: any, addInfo?: any): Result<any, any> {
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
     * @param {any[]} arguments
     * @returns string
     */
    export const sprintf: Function = wrap(sprintfjs.sprintf);
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
     * @param {any[]} arguments
     * @returns string
     */
    export const vsprintf: Function = wrap(sprintfjs.vsprintf);
    // not used at the moment
    // export const sprintf_format: Function = wrap(sprintfjs.sprintf_format);
    // export const sprintf_parse: Function  = wrap(sprintfjs.sprintf_parse);
}
