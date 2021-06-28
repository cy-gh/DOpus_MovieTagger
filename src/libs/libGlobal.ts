///<reference path='../libsExt/libSprintfWrapper.ts' />
///<reference path='./libExceptions.ts' />

namespace g {


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
    export class Result<T, E> implements IResult<T, E> {
        ok: any;
        err: any;
        stack: any[];
        constructor(okValue: T, errValue: E) {
            if (okValue !== undefined)
                this.ok = okValue;
            if (errValue !== undefined)
                this.err = errValue;
            this.stack = [];
        }
        // note this one does not allow any falsy value for OK at all
        isOk() { return !!this.ok; }
        // note this one allows falsy values - '', 0, {}, []... - for OK - USE SPARINGLY
        isValid() { return !this.err; }
        isErr() { return !!this.err; }
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
     * @throws InvalidParameterTypeException
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
            // abortWith(new InvalidParameterTypeException(sprintf('%s -- Given parameter is not a function\n%s', fnName, dumpObject(fnFunc)), fnName));
            throw new exc.InvalidParameterTypeException(libSprintfjs.sprintf('%s -- Given parameter is not a function\n%s', fnName, dumpObject(fnFunc)), fnName);
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
    function showMessageDialog(dialog: DOpusDialog | null, msg: string, title?: string | undefined, buttons?: string | undefined): number {
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
     * @param {UserException} exception
     * @throws {error}
     */
    export function abortWith(exception: exc.IUserException) {
        // memory.clearCache();
        var err = exception.name + ' occurred in ' + exception.where + ':\n\n' + exception.message;
        doh.out('');
        doh.out('');
        doh.out('');
        doh.out('');
        doh.out(err);
        showMessageDialog(null, err);
        throw exception;
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
