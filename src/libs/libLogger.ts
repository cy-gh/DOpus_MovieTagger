/* global DOpus */
///<reference path='../std/libStdDev.ts' />

namespace libLogger {
    export const LOGLEVEL_DEF = LOGLEVEL.ERROR;
    class CLogger implements ILogger {
        private level: LOGLEVEL;
        constructor(level: LOGLEVEL = LOGLEVEL_DEF) {
            this.level = level;
        }
        private _baseout(level: LOGLEVEL, message?: string) { if (level <= this.level) DOpus.output(message || ''); }
        // typescript methods are public by default
        getLevels(): LOGLEVEL[]                     { return g.splitEnum(LOGLEVEL).keys as unknown as LOGLEVEL[]; }
        getLevel(): LOGLEVEL                        { return this.level; }
        getLevelIndex(): IResult<number, boolean>   { return g.findIndexOfValue(LOGLEVEL, this.level); }
        setLevel(level: LOGLEVEL)                   { this.level = level; }

        force(message?: string): void               { this._baseout(LOGLEVEL.FORCE,     message); }
        none(message?: string): void                { this._baseout(LOGLEVEL.NONE,      message); }
        error(message?: string): void               { this._baseout(LOGLEVEL.ERROR,     message); }
        warn(message?: string): void                { this._baseout(LOGLEVEL.WARN,      message); }
        normal(message?: string): void              { this._baseout(LOGLEVEL.NORMAL,    message); }
        info(message?: string): void                { this._baseout(LOGLEVEL.INFO,      message); }
        verbose(message?: string): void             { this._baseout(LOGLEVEL.VERBOSE,   message); }
        sforce(...args: any): void                  { this._baseout(LOGLEVEL.FORCE,     g.sprintf.apply(g.sprintf, args)); }
        snone(...args: any): void                   { this._baseout(LOGLEVEL.NONE,      g.sprintf.apply(g.sprintf, args)); }
        serror(...args: any): void                  { this._baseout(LOGLEVEL.ERROR,     g.sprintf.apply(g.sprintf, args)); }
        swarn(...args: any): void                   { this._baseout(LOGLEVEL.WARN,      g.sprintf.apply(g.sprintf, args)); }
        snormal(...args: any): void                 { this._baseout(LOGLEVEL.NORMAL,    g.sprintf.apply(g.sprintf, args)); }
        sinfo(...args: any): void                   { this._baseout(LOGLEVEL.INFO,      g.sprintf.apply(g.sprintf, args)); }
        sverbose(...args: any): void                { this._baseout(LOGLEVEL.VERBOSE,   g.sprintf.apply(g.sprintf, args)); }
    }
    class NullLogger implements ILogger {
        getLevel(): LOGLEVEL                        { return LOGLEVEL.NONE; }
        setLevel(level: LOGLEVEL): void             { }
        getLevels(): LOGLEVEL[]                     { return []; }
        getLevelIndex(): IResult<number, boolean>   { return g.ResultOk(0); }
        force(message?: string): void               { }
        none(message?: string): void                { }
        error(message?: string): void               { }
        warn(message?: string): void                { }
        normal(message?: string): void              { }
        info(message?: string): void                { }
        verbose(message?: string): void             { }
        sforce(...args: any): void                  { }
        snone(...args: any): void                   { }
        serror(...args: any): void                  { }
        swarn(...args: any): void                   { }
        snormal(...args: any): void                 { }
        sinfo(...args: any): void                   { }
        sverbose(...args: any): void                { }
    }
    /** standard logger */
    export const def = new CLogger();
    /** null logger */
    export const nil = new NullLogger();
    /** default logger */
    export const std = def;
}
