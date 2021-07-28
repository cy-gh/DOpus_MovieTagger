///<reference path='../std/libStdDev.ts' />

/*
     .d8888b. 88888888888  .d88888b.  8888888b.  888       888        d8888 88888888888  .d8888b.  888    888
    d88P  Y88b    888     d88P" "Y88b 888   Y88b 888   o   888       d88888     888     d88P  Y88b 888    888
    Y88b.         888     888     888 888    888 888  d8b  888      d88P888     888     888    888 888    888
     "Y888b.      888     888     888 888   d88P 888 d888b 888     d88P 888     888     888        8888888888
        "Y88b.    888     888     888 8888888P"  888d88888b888    d88P  888     888     888        888    888
          "888    888     888     888 888        88888P Y88888   d88P   888     888     888    888 888    888
    Y88b  d88P    888     Y88b. .d88P 888        8888P   Y8888  d8888888888     888     Y88b  d88P 888    888
     "Y8888P"     888      "Y88888P"  888        888P     Y888 d88P     888     888      "Y8888P"  888    888
*/


enum DurationPhase {
    START,
    RESET,
    ELAPSED,
    STOP,
}

interface Duration extends Number {
    print(type: DurationPhase): string;
    valueOf(): number;
}


namespace stopwatch {

    export class Duration implements Duration {
        private id: string;
        private phase: DurationPhase;
        private val: number;
        private elapsed: number;

        constructor(id: string, phase: DurationPhase, val: number, elapsed: number) {
            this.id      = id;
            this.phase   = phase;
            this.val     = val;
            this.elapsed = elapsed;
        }

        print(prefix?: any, suffix?: any) {
            switch(this.phase) {
                case DurationPhase.START:
                    return g2.sprintf(
                        '%s -- %s Started @%s %s',
                        this.id,
                        (prefix ? prefix + ' -' : ''),
                        this.val,
                        (suffix ? '- ' + suffix : '')
                    );
                case DurationPhase.ELAPSED:
                    return g2.sprintf(
                        '%s -- %s Elapsed so far: %s ms (%s s) %s',
                        this.id,
                        (prefix ? prefix + ' -' : ''),
                        this.elapsed || 0,
                        this.elapsed.formatAsDuration(),
                        (suffix ? '- ' + suffix : '')
                    );
                case DurationPhase.RESET:
                    return g2.sprintf(
                        '%s -- %s Reset @%s, Elapsed so far: %s ms (%s s) %s',
                        this.id,
                        (prefix ? prefix + ' -' : ''),
                        this.val,
                        this.elapsed || 0,
                        this.elapsed.formatAsDuration(),
                        (suffix ? '- ' + suffix : '')
                    );
                case DurationPhase.STOP:
                    return g2.sprintf(
                        '%s -- %s Finished @%s, Elapsed: %s ms (%s s) %s',
                        this.id,
                        (prefix ? prefix + ' -' : ''),
                        g.now(),
                        this.elapsed,
                        this.elapsed.formatAsDuration(),
                        (suffix ? '- ' + suffix : '')
                    );
                default:
                    g.abortWith(Exc(ex.InvalidParameterValue, 'print', 'Phase unknown: ' + this.phase).err);
            }
        }

        valueOf(): number {
            return this.val;
        }
    }

    export class SW {
        private static instance: SW;

        private constructor() { }

        public static getInstance(): SW {
            return SW.instance || (SW.instance = new this());
        };

        /**
         * Mapping between id and start timestamp,
         * we do not need a finish timestamp
         * because a stopwatch is deleted immediately after stop
         * @type {Object.<string, number>}
         */
        private _startTimes: { [s: string]: number; } = {};

        private ensureExists(id: string | number, action: string) {
            const fname = this.ensureExists.fname = 'ensureExists';
            if(this._startTimes[id]) return;
            var msg = g2.sprintf('%s -- Given stopwatch name %s is invalid for action %s (must exist)', fname, id, action);
            g.abortWith(Exc(ex.InvalidParameterValue, fname, msg).err);
        }

        private ensureNotExists(id: string | number, action: string) {
            const fname = this.ensureNotExists.fname = 'ensureNotExists';
            if(!this._startTimes[id]) return;
            var msg = g2.sprintf('%s -- Given stopwatch name %s is invalid for action %s (must not exist)', fname, id, action);
            g.abortWith(Exc(ex.InvalidParameterValue, fname, msg).err);
        }

        /** starts a stopwatch */
        public start(id: string): Duration {
            this.ensureNotExists(id, 'start');
            var _now = g.now();
            this._startTimes[id] = _now;
            return new Duration(id, DurationPhase.START, _now, 0);
        }

        /** resets the stopwatch to current time and returns elapsed time since original start */
        public reset(id: string): Duration {
            this.ensureExists(id, 'reset');
            var _now = g.now();
            var _elapsed = _now - this._startTimes[id];
            this._startTimes[id] = _now;
            return new Duration(id, DurationPhase.RESET, _now, _elapsed);
        }

        /** returns elapsed time */
        public getElapsed(id: string): Duration {
            this.ensureExists(id, 'getElapsed');
            var _elapsed = g.now() - this._startTimes[id];
            return new Duration(id, DurationPhase.ELAPSED, this._startTimes[id], _elapsed);
        }

        /** stops the stopwatch and returns elapsed time */
        public stop(id: string): Duration {
            this.ensureExists(id, 'stop');
            var _elapsed = g.now() - this._startTimes[id];
            var dur = new Duration(id, DurationPhase.STOP, this._startTimes[id], _elapsed);
            delete this._startTimes[id];
            return dur;
        }



        /** starts a stopwatch and returns a formatted string */
        public startAndPrint(id: string, prefix?: any, suffix?: any): string {
            Exc(ex.ObsoleteMethod, 'startAndPrint', 'This method %s() is obsolete, do not use!').show(); return '';
            // this.start(id);
            // return g2.sprintf(
            //     '%s -- %s Started @%s %s',
            //     id,
            //     (prefix ? prefix + ' -' : ''),
            //     this._startTimes[id],
            //     (suffix ? '- ' + suffix : '')
            // );
        }

        /** resets the stopwatch and returns a formatted string */
        public resetAndPrint(id: string, prefix?: any, suffix?: any): string {
            Exc(ex.ObsoleteMethod, 'resetAndPrint', 'This method %s() is obsolete, do not use!').show(); return '';
            // var _elapsed = this.reset(id);
            // return g2.sprintf(
            //     '%s -- %s Reset @%s, Elapsed so far: %s ms (%s s) %s',
            //     id,
            //     (prefix ? prefix + ' -' : ''),
            //     this._startTimes[id],
            //     _elapsed,
            //     _elapsed.formatAsDuration(),
            //     (suffix ? '- ' + suffix : '')
            // );
        }

        /** returns elapsed time as a formatted string */
        public getElapsedAndPrint(id: string, prefix?: any, suffix?: any): string {
            Exc(ex.ObsoleteMethod, 'getElapsedAndPrint', 'This method %s() is obsolete, do not use!').show(); return '';
            // var _elapsed =  this.getElapsed(id);
            // return g2.sprintf(
            //     '%s -- %s Elapsed so far: %s ms (%s s) %s',
            //     id,
            //     (prefix ? prefix + ' -' : ''),
            //     _elapsed,
            //     _elapsed.formatAsDuration(),
            //     (suffix ? '- ' + suffix : '')
            // );
        }

        /** stops a stopwatch and returns elapsed time as a formatted string */
        public stopAndPrint(id: string, prefix?: any, suffix?: any): string {
            Exc(ex.ObsoleteMethod, 'stopAndPrint', 'This method %s() is obsolete, do not use!').show(); return '';
            // var _elapsed = this.stop(id);
            // return g2.sprintf(
            //     '%s -- %s Finished @%s, Elapsed: %s ms (%s s) %s',
            //     id,
            //     (prefix ? prefix + ' -' : ''),
            //     g.now(),
            //     _elapsed,
            //     _elapsed.formatAsDuration(),
            //     (suffix ? '- ' + suffix : '')
            // );
        }
    }
}

const sw = stopwatch.SW.getInstance();
