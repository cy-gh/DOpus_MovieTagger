///<reference path='../std/libStdDev.ts' />

namespace cache {
    /**
     * Memory cache
     * Primarily intended to be implemented via DOpus.Script.Vars
     */
    export interface IMemCache {

        readonly id: string;

        /**
         * Enables the cache
         */
        enable(): void;

        /**
         * Disables the cache
         */
        disable(): void;

        /**
         * Returns if cache is enabled
         * @param {string?} id
         * @returns {boolean} true if cache is enabled globally
         */
        isEnabled(id?: string): boolean;

        /**
         * Initializes cache if necessary and returns it
         * @returns {Result.<DOpusMap, boolean>} cache object on success
         * @private
         */
        getCache(id?: string): IResult<DOpusMap, boolean>;

        /**
         * Clears cache
         * @param {string?} id
         */
        clearCache(id?: string): void;

        /**
         *
         * @param {string?} id
         * @returns {Result.<number, boolean>} number of items in the cache
         */
        getCacheCount(id?: string): IResult<number, boolean>;

        /**
         * @param {any} key
         * @param {string?} id
         * @returns {Result.<any, boolean>}
         */
        getCacheVar(k: any, id?: string): IResult<any, boolean>;

        /**
         * @param {any} key
         * @param {any} val
         * @param {string?} id
         * @returns {Result.<any, boolean>}
         */
        setCacheVar(k: any, v: any, id?: string): IResult<any, boolean>;

        /**
         * @param {any} key
         * @param {string?} id
         * @returns {Result.<any, boolean>}
         */
        delCacheVar(k: any, id?: string): IResult<any, boolean>;

    }

    // https://stackoverflow.com/q/43578173
    declare var IMemCache: {
        /**
         * @constructor
         */
        new(id: string): IMemCache;
    }


    export class MemCache implements IMemCache {

        public static DEFAULT_NAME = 'memory';
        public readonly id: string;
        private enabled: boolean;

        constructor(id:string = MemCache.DEFAULT_NAME, enabled:boolean = true) {
            this.id      = id;
            this.enabled = enabled;
        }

        enable() {
            this.enabled = true;
        }

        disable() {
            this.enabled = false;
        }

        isEnabled(id?: string): boolean {
            return this.enabled;
        }

        getCache(id?: string): IResult<DOpusMap, boolean> {
            if (!this.isEnabled())
                return g.ResultErr(false);
            if (!Script.vars.exists(id||this.id))
                this.clearCache();
            return g.ResultOk(Script.vars.get(id||this.id));
        }

        clearCache(id?: string) {
            if (this.isEnabled())
                Script.vars.set(id||this.id, DOpus.create().map());
        }

        getCacheCount(id?: string) {
            var resCache = this.getCache(id||this.id);
            return resCache.isOk()
                ? g.ResultOk((<DOpusMap>resCache.ok).count)
                : g.ResultErr(true);
        }

        getCacheVar(k: any, id?: string) {
            var resCache = this.getCache(id||this.id);
            if (resCache.isErr()) {
                return g.ResultErr(true);
            } else {
                return (<DOpusMap>resCache.ok).exists(k)
                    ? g.ResultOk((<DOpusMap>resCache.ok).get(k))
                    : g.ResultErr(true);
            }
        }

        setCacheVar(k: any, v: any, id?: string) {
            var resCache = this.getCache(id||this.id);
            if (resCache.isErr()) {
                return g.ResultErr(true);
            } else {
                (<DOpusMap>resCache.ok).set(k, v);
                return g.ResultOk(true);
            }
        }

        delCacheVar(k: any, id?: string) {
            var resCache = this.getCache(id||this.id);
            if (resCache.isErr()) {
                return g.ResultErr(true);
            } else {
                (<DOpusMap>resCache.ok).erase(k);
                return g.ResultOk(true);
            }
        }

    }

    class NullCache implements IMemCache {
        public id: string;
        constructor(id: string) { this.id = id };
        enable(): void {}
        disable(): void {}
        isEnabled(id?: string): boolean { return false; }
        getCache(id?: string): IResult<DOpusMap, boolean> { return g.ResultErr(true) }
        clearCache(id?: string): void {}
        getCacheCount(id?: string): IResult<number, boolean> {return g.ResultErr(true) }
        getCacheVar(k: any, id?: string): IResult<any, boolean> { return g.ResultErr(true) }
        setCacheVar(k: any, v: any, id?: string): IResult<any, boolean> { return g.ResultErr(true) }
        delCacheVar(k: any, id?: string): IResult<any, boolean> { return g.ResultErr(true) }

    }

    /* default cache, which does nothing */
    export const nullCache = new NullCache('dummy');
}
