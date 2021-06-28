/* global DOpus */
// see https://www.typescriptlang.org/docs/handbook/namespaces-and-modules.html
///<reference path='../libsExt/libSprintfWrapper.ts' />
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

        public sforce(message?: string, ...args: any)       { this._baseout(LOGLEVEL.FORCE,     libSprintfjs.sprintf.apply(libSprintfjs.sprintf, args)); }
        public snone(message?: string, ...args: any)        { this._baseout(LOGLEVEL.NONE,      libSprintfjs.sprintf.apply(libSprintfjs.sprintf, args)); }
        public serror(message?: string, ...args: any)       { this._baseout(LOGLEVEL.ERROR,     libSprintfjs.sprintf.apply(libSprintfjs.sprintf, args)); }
        public swarn(message?: string, ...args: any)        { this._baseout(LOGLEVEL.WARN,      libSprintfjs.sprintf.apply(libSprintfjs.sprintf, args)); }
        public snormal(message?: string, ...args: any)      { this._baseout(LOGLEVEL.NORMAL,    libSprintfjs.sprintf.apply(libSprintfjs.sprintf, args)); }
        public sinfo(message?: string, ...args: any)        { this._baseout(LOGLEVEL.INFO,      libSprintfjs.sprintf.apply(libSprintfjs.sprintf, args)); }
        public sverbose(message?: string, ...args: any)     { this._baseout(LOGLEVEL.VERBOSE,   libSprintfjs.sprintf.apply(libSprintfjs.sprintf, args)); }

        // OBSOLETE - these were used for the unwrapped sprintf.js
        // public sforce(message?: string, ...args: any)   { this._baseout(LOGLEVEL.FORCE,   sprintf.apply(sprintf, args)); };
        // public snone(message?: string, ...args: any)    { this._baseout(LOGLEVEL.NONE,    sprintf.apply(sprintf, args)); };
        // public serror(message?: string, ...args: any)   { this._baseout(LOGLEVEL.ERROR,   sprintf.apply(sprintf, args)); };
        // public swarn(message?: string, ...args: any)    { this._baseout(LOGLEVEL.WARN,    sprintf.apply(sprintf, args)); };
        // public snormal(message?: string, ...args: any)  { this._baseout(LOGLEVEL.NORMAL,  sprintf.apply(sprintf, args)); };
        // public sinfo(message?: string, ...args: any)    { this._baseout(LOGLEVEL.INFO,    sprintf.apply(sprintf, args)); };
        // public sverbose(message?: string, ...args: any) { this._baseout(LOGLEVEL.VERBOSE, sprintf.apply(sprintf, args)); };
    }
    export const logger = new CLogger();
}
