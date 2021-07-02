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


interface IResult<S,E> {
    ok: S|false;
    err: E|true;
    stack: Array<any>;
    isOk(): boolean;
    isValid(): boolean;
    isErr(): boolean;
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

    /**
     *
     */
    trim(): string;
}
