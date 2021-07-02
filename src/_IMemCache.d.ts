///<reference path='./_Helpers.d.ts' />


/**
 * Memory cache
 * Primarily intended to be implemented via DOpus.Script.Vars
 */
interface IMemCache {

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
     * */
    clearCache(id?: string): void;

    /**
     *
     * @param {string?} id
     * @returns {Result.<number, boolean>} number of items in the cache
     * */
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
