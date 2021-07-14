/* global DOpus */
///<reference path='../std/libStdDev.ts' />

namespace libLogger {

    class StandardLogger implements ILogger {
        private level: g.LOGLEVEL;
        constructor(level: g.LOGLEVEL = g.LOGLEVEL.ERROR) {
            this.level = level;
        }

        private _baseout(level: g.LOGLEVEL, message?: string, isError = false, withTimestamp = false) { if (level <= this.level) DOpus.output(message || '', isError, withTimestamp); }
        // typescript methods are public by default
        getLevels(): g.LOGLEVEL[]                   { return g.splitEnum(g.LOGLEVEL).keys as unknown as g.LOGLEVEL[]; }
        getLevel(): g.LOGLEVEL                      { return this.level; }
        getLevelIndex(): IResult<number, boolean>   { return g.findIndexOfValue(g.LOGLEVEL, this.level); }
        setLevel(level: g.LOGLEVEL)                 { this.level = level; }
        show(message?: any): typeof message         { DOpus.output(message); return message; }
        force(message?: string): void               { this._baseout(g.LOGLEVEL.FORCE,     message); }
        none(message?: string): void                { this._baseout(g.LOGLEVEL.NONE,      message); }
        error(message?: string): void               { this._baseout(g.LOGLEVEL.ERROR,     message, true); }
        warn(message?: string): void                { this._baseout(g.LOGLEVEL.WARN,      message); }
        normal(message?: string): void              { this._baseout(g.LOGLEVEL.NORMAL,    message); }
        info(message?: string): void                { this._baseout(g.LOGLEVEL.INFO,      message); }
        verbose(message?: string): void             { this._baseout(g.LOGLEVEL.VERBOSE,   message); }
        sforce(...args: any): void                  { this._baseout(g.LOGLEVEL.FORCE,     g.sprintf.apply(g.sprintf, args)); }
        snone(...args: any): void                   { this._baseout(g.LOGLEVEL.NONE,      g.sprintf.apply(g.sprintf, args)); }
        serror(...args: any): void                  { this._baseout(g.LOGLEVEL.ERROR,     g.sprintf.apply(g.sprintf, args)); }
        swarn(...args: any): void                   { this._baseout(g.LOGLEVEL.WARN,      g.sprintf.apply(g.sprintf, args)); }
        snormal(...args: any): void                 { this._baseout(g.LOGLEVEL.NORMAL,    g.sprintf.apply(g.sprintf, args)); }
        sinfo(...args: any): void                   { this._baseout(g.LOGLEVEL.INFO,      g.sprintf.apply(g.sprintf, args)); }
        sverbose(...args: any): void                { this._baseout(g.LOGLEVEL.VERBOSE,   g.sprintf.apply(g.sprintf, args)); }
    }

    class NullLogger implements ILogger {
        getLevel(): g.LOGLEVEL                      { return g.LOGLEVEL.NONE; }
        setLevel(level: g.LOGLEVEL): void           { }
        getLevels(): g.LOGLEVEL[]                   { return []; }
        getLevelIndex(): IResult<number, boolean>   { return g.ResultOk(0); }
        show(message?: any): typeof message         { return message; }
        force(message?: string): void               { }
        none(message?: string): void                { }
        error(message?: string): void               { }
        warn(message?: string): void                { }
        normal(message?: string): void              { }
        info(message?: string): void                { }
        verbose(message?: string): void             { }
        sforce(): void                              { }
        snone(): void                               { }
        serror(): void                              { }
        swarn(): void                               { }
        snormal(): void                             { }
        sinfo(): void                               { }
        sverbose(): void                            { }
    }

    /** standard logger */
    export const std = new StandardLogger();

    /** null logger - only for benchmarking purposes */
    export const nil = new NullLogger();

    /** current logger, can be set externally, ALWAYS prefer this */
    export var current = std;
}
