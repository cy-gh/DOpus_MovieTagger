/* global DOpus */
///<reference path='../std/libStdDev.ts' />

namespace libLogger {
    export enum LOGLEVEL {
        FORCE   = -1,
        NONE    = 0,
        ERROR   = 1,
        WARN    = 2,
        NORMAL  = 3,
        INFO    = 4,
        VERBOSE = 5
    }
    export const LOGLEVEL_DEF = LOGLEVEL.ERROR;
    export interface ILogger {
        getLevel(): LOGLEVEL;
        setLevel(level: LOGLEVEL): void;
        getLevels(): LOGLEVEL[];
    }
    export class CLogger implements ILogger {
        private level: LOGLEVEL;
        constructor(level: LOGLEVEL = LOGLEVEL_DEF) {
            this.level = level;
        }
        private _baseout(level: LOGLEVEL, message?: string) { if (level <= this.level) DOpus.output(message || ''); }
        public getLevels(): LOGLEVEL[] { throw new Error("Method not implemented."); }
        public getLevel(): LOGLEVEL { return this.level; }
        public setLevel(level: LOGLEVEL) { this.level = level; }

        public force(message?: string)   { this._baseout(LOGLEVEL.FORCE,    message); }
        public none(message?: string)    { this._baseout(LOGLEVEL.NONE,     message); }
        public error(message?: string)   { this._baseout(LOGLEVEL.ERROR,    message); }
        public warn(message?: string)    { this._baseout(LOGLEVEL.WARN,     message); }
        public normal(message?: string)  { this._baseout(LOGLEVEL.NORMAL,   message); }
        public info(message?: string)    { this._baseout(LOGLEVEL.INFO,     message); }
        public verbose(message?: string) { this._baseout(LOGLEVEL.VERBOSE,  message); }

        public sforce(...args: any)       { this._baseout(LOGLEVEL.FORCE,     g.sprintf.apply(g.sprintf, args)); }
        public snone(...args: any)        { this._baseout(LOGLEVEL.NONE,      g.sprintf.apply(g.sprintf, args)); }
        public serror(...args: any)       { this._baseout(LOGLEVEL.ERROR,     g.sprintf.apply(g.sprintf, args)); }
        public swarn(...args: any)        { this._baseout(LOGLEVEL.WARN,      g.sprintf.apply(g.sprintf, args)); }
        public snormal(...args: any)      { this._baseout(LOGLEVEL.NORMAL,    g.sprintf.apply(g.sprintf, args)); }
        public sinfo(...args: any)        { this._baseout(LOGLEVEL.INFO,      g.sprintf.apply(g.sprintf, args)); }
        public sverbose(...args: any)     { this._baseout(LOGLEVEL.VERBOSE,   g.sprintf.apply(g.sprintf, args)); }
    }
    export const logger = new CLogger();
}
