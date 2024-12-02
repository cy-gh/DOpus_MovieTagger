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
        force(message?: string): void               { this._baseout(g.LOGLEVEL.NONE,      '<b>'+message+'</b>'); }
        error(message?: string): void               { this._baseout(g.LOGLEVEL.ERROR,     message, true); }
        warn(message?: string): void                { this._baseout(g.LOGLEVEL.WARN,      '<i>'+message+'</i>'); }
        normal(message?: string): void              { this._baseout(g.LOGLEVEL.NORMAL,    message); }
        info(message?: string): void                { this._baseout(g.LOGLEVEL.INFO,      message); }
        verbose(message?: string): void             { this._baseout(g.LOGLEVEL.VERBOSE,   message); }
        sforce(...args: any): void                  { this._baseout(g.LOGLEVEL.NONE,      '<b>' + g2.sprintf.apply(g2.sprintf, args) + '</b>'); }
        serror(...args: any): void                  { this._baseout(g.LOGLEVEL.ERROR,     g2.sprintf.apply(g2.sprintf, args), true); }
        swarn(...args: any): void                   { this._baseout(g.LOGLEVEL.WARN,      '<i>' + g2.sprintf.apply(g2.sprintf, args) + '</i>'); }
        snormal(...args: any): void                 { this._baseout(g.LOGLEVEL.NORMAL,    g2.sprintf.apply(g2.sprintf, args)); }
        sinfo(...args: any): void                   { this._baseout(g.LOGLEVEL.INFO,      g2.sprintf.apply(g2.sprintf, args)); }
        sverbose(...args: any): void                { this._baseout(g.LOGLEVEL.VERBOSE,   g2.sprintf.apply(g2.sprintf, args)); }
    }

    class NullLogger implements ILogger {
        getLevels(): g.LOGLEVEL[]                   { return g.splitEnum(g.LOGLEVEL).keys as unknown as g.LOGLEVEL[]; }
        getLevel(): g.LOGLEVEL                      { return g.LOGLEVEL.NONE; }
        getLevelIndex(): IResult<number, boolean>   { return g.ResultOk(0); }
        setLevel(level: g.LOGLEVEL): void           { }
        show(message?: any): typeof message         { return message; }
        force(message?: string): void               { }
        error(message?: string): void               { }
        warn(message?: string): void                { }
        normal(message?: string): void              { }
        info(message?: string): void                { }
        verbose(message?: string): void             { }
        sforce(): void                              { }
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
    export const current = std;
}
