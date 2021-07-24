///<reference path='../std/libStdDev.ts' />

namespace cache {

    export enum TYPE {
        MEMORY = 'MEMORY',
        NULL   = 'NULL',
    }

    /**
     * Memory cache, primarily intended to be implemented via Script.Vars
     * but can be also used during initialization.
     */
    export interface IMemCache extends ILibrary<IMemCache> {

        readonly id: string;

        readonly type: cache.TYPE;

        /** Enables the cache */
        enable(): void;

        /** Disables the cache */
        disable(): void;

        /** Returns if cache is enabled */
        isEnabled(): boolean;

        /** Initializes cache if necessary and returns it */
        get(): IOption<DOpusMap>;

        /** Clears cache */
        clear(): void;

        /** Returns the number of items in the cache */
        getCount(): IOption<number>;

        /** Gets the value for given key */
        getVar(k: string|number): IOption<any>;

        /** Sets the value for given key, and returns the cache for method chaining */
        setVar(k: string|number, v: any): IMemCache;

        /** Deletes given key, and returns deleted value if it existed before*/
        delVar(k: string|number): IOption<any>;

    }



    export class MemCache implements IMemCache {
        public readonly id: string;
        public readonly type = TYPE.MEMORY;
        /** if cache needs to be used during OnInit() then we need this variable */
        private initData: DOpusScriptInitData | undefined;
        private logger: ILogger = libLogger.current;
        private enabled: boolean;

        private static DEFAULT_NAME = 'memory';
        private static instances: { [_: string]: IMemCache } = {};

        private constructor(initData?: DOpusScriptInitData, id?: string) {
            this.id       = id || MemCache.DEFAULT_NAME;
            this.enabled  = true;
            this.initData = initData;
        }

        static getInstance(initData?: DOpusScriptInitData, id: string = MemCache.DEFAULT_NAME): IMemCache {
            MemCache.instances[id] = MemCache.instances[id] || new MemCache(initData, id);
            return MemCache.instances[id];
        }

        setLogger(newLogger?: ILogger) {
            this.logger = newLogger || this.logger;
            return this;
        }

        enable()  { this.enabled = true; }
        disable() { this.enabled = false; }
        isEnabled(id?: string): boolean { return this.enabled; }

        private getVarsVar() {
            return g.isInitializing() && this.initData
                ? this.initData.vars
                : Script.vars
        }

        get() {
            if (!this.isEnabled())
                return g.OptionNone();
            if (!this.getVarsVar().exists(this.id))
                this.clear();
            return g.OptionSome(this.getVarsVar().get(this.id));
        }

        clear() {
            if (this.isEnabled())
                this.getVarsVar().set(this.id, DOpus.create().map());
        }

        getCount() {
            return this.get().match({
                some: (some: DOpusMap) => some.count,
                none: () => g.OptionNone()
            });
        }

        getVar(k: any) {
            var optCache = this.get();
            if (optCache.isNone()) {
                return g.OptionNone();
            } else {
                return optCache.some.exists(k)
                    ? g.OptionSome(optCache.some.get(k))
                    : g.OptionNone();
            }
        }

        setVar(k: any, v: any) {
            var resCache = this.get();
            if (resCache.isSome()) {
                resCache.some.set(k, v);
            }
            return this;
        }

        delVar(k: any, id?: string) {
            var optCache = this.get();
            if (optCache.isNone()) {
                return g.OptionNone();
            } else {
                if (optCache.some.exists(k)) {
                    const _tmp = optCache.some.get(k);
                    optCache.some.erase(k);
                    return g.OptionSome(_tmp);
                } else {
                    return g.OptionNone();
                }
            }
        }

    }

    export class NullCache implements IMemCache {
        public readonly id: string;
        public readonly type = TYPE.NULL;

        private static DEFAULT_NAME = 'dummy';
        private static instance: IMemCache;

        private constructor() {
            this.id = NullCache.DEFAULT_NAME;
        }

        static getInstance() {
            NullCache.instance = NullCache.instance || new NullCache();
            return NullCache.instance;
        }

        setLogger(newLogger: ILogger)   { return this }
        enable()                        { }
        disable()                       { }
        isEnabled()                     { return false }
        get()                           { return g.OptionNone() }
        clear()                         { }
        getCount()                      { return g.OptionNone() }
        getVar()        { return g.OptionNone() }
        setVar(k: string|number, v: any){ return this }
        delVar(k: string|number)        { return g.OptionNone() }

    }

    /**
     * ⚠
     *
     * Do not use the following, use getInstance() methods instead
     * otherwise we cannot use cache during OnInit()
     */
    // /** standard cache */
    // export const std = MemCache.getInstance();
    // /* null cache - does nothing */
    // export const nil = NullCache.getInstance();
    // /** current cache, can be set externally, ALWAYS prefer this */
    // export const current = std;
}
