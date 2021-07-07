/* global DOpus */

type sizeUnit = [string, number];
type sizeUnits = {
    [key: string]: sizeUnit
}

interface DateComponents {
    year        : string,
    month       : string,
    day         : string,
    hour        : string,
    minute      : string,
    second      : string,
    millisec    : string,
    timezone?   : string
}

interface Date {
    /**
     * turns timestamp to ISO like "20210119-182416" format
     */
    formatAsDateTimeCompact(): string;
}

interface Number {
    /**
     * turns 2^10 to "KB", 2^20 to "MB" and so on
     */
    getUnit(): sizeUnit;

    /**
     * Converts given timestamp to string
     * and splits into individual, auto-zero padded components
     */
    convertToDateComponents(asUTC?: boolean): DateComponents;

    /**
     * turns 2^10 to "1.0 KB", 2^20 to "1.0 MB" and so on
     * @param unit custom unit
     * @param decimal how many decimals
     */
    formatAsSize(unit?: sizeUnit, decimal?: number): string;
    /**
     * turns milliseconds to rounded seconds
     */
    formatAsDuration(): string;
    /**
     * converts timestamps to time format
     */
    formatAsHms(): string;
    /**
     * turns timestamp to ISO "2021-01-19T18:24:16.123Z" format
     */
    formatAsDateISO(): string;
    /**
     * turns timestamp to ISO like "20210119-182416" format
     */
    formatAsDateTimeCompact(): string;
    /**
     * turns timestamp to DOpus "D2021-01-19 T18:24:16" format
     */
    formatAsDateDOpus(): string;
}

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
function DateToDOpusFormat(oItemDate: Date) {
    return DOpus.create().date(oItemDate).format('D#yyyy-MM-dd T#HH:mm:ss');
}
