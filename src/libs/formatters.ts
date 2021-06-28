///<reference path='./libExceptions.ts' />
///<reference path='./libDOpusHelper.ts' />

const sizeUnits:sizeUnits = {
    'B' : [ 'B', 0],
    'KB': [ 'KB', Math.pow(2, 10)],
    'MB': [ 'MB', Math.pow(2, 20)],
    'GB': [ 'GB', Math.pow(2, 30)],
    'TB': [ 'TB', Math.pow(2, 40)],
    'PB': [ 'PB', Math.pow(2, 50)] // if somebody manages to see this, I will buy you a beer!
};

/**
 * turns 2^10 to "KB", 2^20 to "MB" and so on
 * @returns {sizeUnit}
 */
Number.prototype.getUnit = function(): sizeUnit {
    let v = Math.abs(this.valueOf());
    if      (v >= sizeUnits.PB[1]) return sizeUnits.PB;
    else if (v >= sizeUnits.TB[1]) return sizeUnits.TB;
    else if (v >= sizeUnits.GB[1]) return sizeUnits.GB;
    else if (v >= sizeUnits.MB[1]) return sizeUnits.MB;
    else if (v >= sizeUnits.KB[1]) return sizeUnits.KB;
    else                           return sizeUnits.B;
};

/**
 * turns 2^10 to "1.0 KB", 2^20 to "1.0 MB" and so on
 * @param {sizeUnit} unit
 * @param {number} decimal
 */
Number.prototype.formatAsSize = function (unit: sizeUnit, decimal: number) {
    if (this.valueOf() === 0) {
        return '0 bytes';
    }
    if (typeof unit === 'undefined' || !unit.length) {
        unit = this.getUnit();
    }
    if (typeof decimal !== 'number') {
        decimal = 2;
    }
    if (unit[1] === 0) {
        return this.valueOf() + ' ' + unit[0];
    } else {
        return (this.valueOf() / unit[1]).toFixed(decimal) + ' ' + unit[0];
    }
};

/** Turns milliseconds to rounded seconds */
Number.prototype.formatAsDuration = function () {
    return (this.valueOf()/1000).toFixed(1);
};

/** Converts timestamps to time format, "18:24:16" */
Number.prototype.formatAsHms = function () {
    return new Date(this.valueOf()).toTimeString().substr(0,8);
};

Number.prototype.convertToDateComponents = function(asUTC?: boolean) {
    function autoZeroPadLeft(n: number): string {
        return n < 10 ? '0' + n.toString() : n.toString()
    }
    const oDate     = new Date(this.valueOf());
    // const vYear     =                     (asUTC ? oDate.getUTCFullYear() : oDate.getFullYear()).toString();
    // const vMonth    = autoZeroPadLeft(1 + (asUTC ? oDate.getUTCMonth()    : oDate.getMonth()));
    // const vDay      = autoZeroPadLeft(     asUTC ? oDate.getUTCDate()     : oDate.getDate());
    // const vHours    = autoZeroPadLeft(     asUTC ? oDate.getUTCHours()    : oDate.getHours());
    // const vMinutes  = autoZeroPadLeft(     asUTC ? oDate.getUTCMinutes()  : oDate.getMinutes());
    // const vSeconds  = autoZeroPadLeft(     asUTC ? oDate.getUTCSeconds()  : oDate.getSeconds());
    // const vMilliS   = ((asUTC ? oDate.getUTCMilliseconds() : oDate.getMilliseconds()) / 1000).toFixed(3).slice(2, 5);
    // const vTimezone = oDate.getTimezoneOffset().toString();
    return <DateComponents>{
        year     :                     (asUTC ? oDate.getUTCFullYear() : oDate.getFullYear()).toString(),
        month    : autoZeroPadLeft(1 + (asUTC ? oDate.getUTCMonth()    : oDate.getMonth())),
        day      : autoZeroPadLeft(     asUTC ? oDate.getUTCDate()     : oDate.getDate()),
        hour     : autoZeroPadLeft(     asUTC ? oDate.getUTCHours()    : oDate.getHours()),
        minute   : autoZeroPadLeft(     asUTC ? oDate.getUTCMinutes()  : oDate.getMinutes()),
        second   : autoZeroPadLeft(     asUTC ? oDate.getUTCSeconds()  : oDate.getSeconds()),
        millisec : ((asUTC ? oDate.getUTCMilliseconds() : oDate.getMilliseconds()) / 1000).toFixed(3).slice(2, 5),
        timezone : oDate.getTimezoneOffset().toString()
    }
}
/** Turns timestamp to ISO "2021-01-19T18:24:16.123Z" format */
Number.prototype.formatAsDateISO = function () {
    const dc = this.convertToDateComponents(true);
    return dc.year + '-' + dc.month + '-' + dc.day + ' T' + dc.hour + ':' + dc.minute + ':' + dc.second + '.' + dc.millisec + 'Z';
};

/**  Turns timestamp to ISO like "20210119-182416" format */
Number.prototype.formatAsDateTimeCompact = function () {
    const dc = this.convertToDateComponents();
    return dc.year + dc.month + dc.day + '-' + dc.hour + dc.minute + dc.second ;
};

/** Turns timestamp to DOpus "D2021-01-19 T18:24:16" format */
Number.prototype.formatAsDateDOpus = function () {
    // "D2021-01-19 T18:24:16"
    const dc = this.convertToDateComponents();
    return 'D' + dc.year + '-' + dc.month + '-' + dc.day + ' T' + dc.hour + ':' + dc.minute + ':' + dc.second;
};

/**
 * Date formatter for "SetAttr META lastmodifieddate..."
 * D2021-01-19 T18:24:16
 * similar to formatAsDateDOpus()
 * Note that, this works only for DOpusDate not JS Date!
 */
function DateToDOpusFormat(oItemDate: DOpusDate) {
    return doh.dc.date(oItemDate).format('D#yyyy-MM-dd T#HH:mm:ss');
}

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
        // abortWith(new InvalidNumberException('This string cannot be parsed as a number: ' + this.valueOf(), 'asInt'));
        throw new exc.InvalidNumberException('This string cannot be parsed as a number: ' + this.valueOf(), 'asInt');
    }
    return num;
};

/** Trim for JScript */
String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, ''); // not even trim() JScript??
};
