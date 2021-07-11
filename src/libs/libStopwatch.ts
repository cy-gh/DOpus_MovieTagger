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

namespace SW {
    const myName = 'sw';

    class Stopwatch {
        private myName = myName + '.Stopwatch';

        private static myName = 'stopwatch';

        /**
         * Mapping between id and start timestamp,
         * we do not need a finish timestamp
         * because a stopwatch is deleted immediately after stop
         * @type {Object.<string, number>}
         */
        private _running: { [s: string]: number; } = {};

        private ensureExists(id: string | number, action: string) {
            const fname = this.ensureExists.fname = myName + '.ensureExists';
            if(this._running[id]) return;
            var msg = g.sprintf('%s -- Given stopwatch name %s is invalid for action %s (must exist)', fname, id, action);
            g.abortWith(UserExc(ex.InvalidParameterValueException, fname, msg).err);
        }

        private ensureNotExists(id: string | number, action: string) {
            const fname = this.ensureNotExists.fname = myName + '.ensureNotExists';
            if(!this._running[id]) return;
            var msg = g.sprintf('%s -- Given stopwatch name %s is invalid for action %s (must not exist)', fname, id, action);
            g.abortWith(UserExc(ex.InvalidParameterValueException, fname, msg).err);
        }

        /**
         * starts a stopwatch
         * @param {string} id any unique name
         * @returns {number} current timestamp in millisecs
         */
        public start(id: string): number {
            const fname = this.start.fname = myName + '.start';
            this.ensureNotExists(id, 'start');
            var _now = g.now();
            this._running[id] = _now;
            return _now;
        }

        /**
         * resets the stopwatch to current time and returns elapsed time since original start
         * @param {string} id any unique name
         * @returns {number} elapsed time in millisecs
         */
        public reset(id: string): number {
            const fname = this.reset.fname = myName + '.reset';
            this.ensureExists(id, 'reset');
            var _now = g.now();
            var _elapsed = _now - this._running[id];
            this._running[id] = _now;
            return _elapsed;
        }

        /**
         * returns elapsed time
         * @param {string} id any unique name
         * @returns {number} elapsed time in millisecs
         */
        public getElapsed(id: string): number {
            const fname = this.getElapsed.fname = myName + '.getElapsed';
            this.ensureExists(id, 'getElapsed');
            var _elapsed =  g.now() - this._running[id];
            return _elapsed;
        }

        /**
         * stops the stopwatch and returns elapsed time
         * @param {string} id any unique name
         * @returns {number} elapsed time in millisecs
         */
        public stop(id: string): number {
            const fname = this.stop.fname = myName + '.stop';
            this.ensureExists(id, 'stop');
            var _elapsed = g.now() - this._running[id];
            delete this._running[id];
            return _elapsed;
        }

        /**
         * starts a stopwatch and returns a formatted string
         * @param {string} id any unique name
         * @param {any=} prefix prefix in output
         * @param {any=} suffix suffix in output
         * @returns {string} formatted string
         * @see start
         */
        public startAndPrint(id: string, prefix?: any, suffix?: any): string {
            const fname = this.startAndPrint.fname = myName + '.startAndPrint';
            this.start(id);
            return g.sprintf(
                '%s -- %s Started @%d %s',
                id,
                (prefix ? prefix + ' -' : ''),
                this._running[id],
                (suffix ? '- ' + suffix : '')
            );
        }

        /**
         * resets the stopwatch and returns a formatted string
         * @param {string} id any unique name
         * @param {any=} prefix prefix in output
         * @param {any=} suffix suffix in output
         * @returns {string} formatted string
         * @see reset
         */
        public resetAndPrint(id: string, prefix?: any, suffix?: any): string {
            const fname = this.resetAndPrint.fname = myName + '.resetAndPrint';
            var _elapsed = this.reset(id);
            return g.sprintf(
                '%s -- %s Reset @%d, Elapsed so far: %d ms (%s s) %s',
                id,
                (prefix ? prefix + ' -' : ''),
                this._running[id],
                _elapsed,
                _elapsed.formatAsDuration(),
                (suffix ? '- ' + suffix : '')
            );
        }

        /**
         * returns elapsed time as a formatted string
         * @param {string} id any unique name
         * @param {any=} prefix prefix in output
         * @param {any=} suffix suffix in output
         * @returns {string} formatted string
         * @see getElapsed
         */
        public getElapsedAndPrint(id: string, prefix?: any, suffix?: any): string {
            const fname = this.getElapsedAndPrint.fname = myName + '.getElapsedAndPrint';
            var _elapsed =  this.getElapsed(id);
            return g.sprintf(
                '%s -- %s Elapsed so far: %d ms (%s s) %s',
                id,
                (prefix ? prefix + ' -' : ''),
                _elapsed,
                _elapsed.formatAsDuration(),
                (suffix ? '- ' + suffix : '')
            );
        }

        /**
         * stops a stopwatch and returns elapsed time as a formatted string
         * @param {string} id any unique name
         * @param {any=} prefix prefix in output
         * @param {any=} suffix suffix in output
         * @returns {string} formatted string
         * @see stop
         */
        public stopAndPrint(id: string, prefix?: any, suffix?: any): string {
            const fname = this.stopAndPrint.fname = myName + '.stopAndPrint';
            var _elapsed = this.stop(id);
            return g.sprintf(
                '%s -- %s Finished @%d, Elapsed: %d ms (%s s) %s',
                id,
                (prefix ? prefix + ' -' : ''),
                g.now(),
                _elapsed,
                _elapsed.formatAsDuration(),
                (suffix ? '- ' + suffix : '')
            );
        }

    }

    export const stopwatch = new Stopwatch();

}
