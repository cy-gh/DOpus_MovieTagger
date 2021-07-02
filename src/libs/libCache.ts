///<reference path='../_IMemCache.d.ts' />

class CCache implements IMemCache {

    public static DEFAULT_NAME = 'memory';
    public readonly id: string;
    private enabled: boolean;

    constructor(id:string = CCache.DEFAULT_NAME, enabled:boolean = true) {
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
