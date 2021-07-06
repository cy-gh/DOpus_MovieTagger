///<reference path='../std/libStdDev.ts' />
///<reference path='./formatters.ts' />
///<reference path='./libLogger.ts' />


/*
    why we need separate interfaces for the constructor and the rest is explained here:
    https://www.typescriptlang.org/docs/handbook/interfaces.html#class-types
    https://stackoverflow.com/q/43578173
    https://stackoverflow.com/a/13408029
    https://stackoverflow.com/a/13700960


    interface ClockConstructor {
        new (hour: number, minute: number): ClockInterface;
    }
    interface ClockInterface {
        tick();
    }

    function createClock(ctor: ClockConstructor, hour: number, minute: number): ClockInterface {
        return new ctor(hour, minute);
    }

    class DigitalClock implements ClockInterface {
        constructor(h: number, m: number) { }
        tick() {
            console.log("beep beep");
        }
    }
    class AnalogClock implements ClockInterface {
        constructor(h: number, m: number) { }
        tick() {
            console.log("tick tock");
        }
    }
    let digital = createClock(DigitalClock, 12, 17); let analog =
    createClock(AnalogClock, 7, 32);


    Example from lib.d.ts:

    interface Object {
        toString(): string;
        toLocaleString(): string;
        // ... rest ...
    }
    declare var Object: {
        new (value?: any): Object;
        (): any;
        (value: any): any;
        // ... rest ...
    }

*/
interface IADSFileAttr {
    setAttr  : string;
    clearAttr: string;
}
interface IADSFileAttrConstructor {
    new (s: string, c: string): IADSFileAttr;
}


interface ICachedItem {
    readonly last_modify          : number;
    readonly last_modify_friendly : string;
    readonly last_size            : number;
    readonly last_size_friendly   : string;
}

interface ICachedItemConstructor {
    /**
     * ADS-Cached Item
     * modify date & size are optional, if not given the DOpusItem will be used
     *
     * @param {DOpusItem} oItem DOpus Item object
     * @param {Date=} modify file mod date
     * @param {number=} size file size
     * @param {...any}
     * @constructor
     */
    new (oItem: DOpusItem, modify?: Date, size?: number, ...args: any): ICachedItem;
}


interface ADS {
    /**
     * @param {DOpusItem} oItem
     * @returns {IADSFileAttr} strings to restore previous file attributes
     */
    getFileAttributes(oItem: DOpusItem): IADSFileAttr;


    /**
     * checks if given item has a hash stream
     * @param {DOpusItem} oItem DOpus Item object
     * @returns {boolean} true if file has a hash stream
     */
    hasHashStream(oItem: DOpusItem): boolean;

    /**
     * returns the stored ADS data as POJO
     * uses cache if enabled and possible
     * @param {DOpusItem} oItem DOpus Item object
     * @returns {Result.<ICachedItem, string>} CachedItem on success, error string on error
     * @see fs.readFile()
     */
    read(oItem: DOpusItem): IResult<ICachedItem, string>;

    /**
     * saves given POJO as ADS data, calls SaveFile()
     * populates/updates cache if enabled
     * returns immediately on 1st error
     * @param {DOpusItem|ICustomDOpusVector<DOpusMap>} oItemOrItems DOpus Item object or Items Vector
     * @param {ICachedItem} oCachedItemOrNull if 1st parameter is a vector, this can be passed as null
     * @returns {Result.<number, string>} number of total bytes written on success, error string on 1st error
     * @see fs.saveFile()
     */
    save(oItemOrItems: DOpusItem|DOpusVector<DOpusMap>, oCachedItemOrNull: ICachedItem|null): IResult<number, string>;

    /**
     * deletes ADS data, directly deletes "file:stream"
     * removes item from cache if enabled
     * @param {DOpusItem|ICustomDOpusVector<DOpusItem>} oItemOrItems DOpus Item object or Items Vector
     */
    remove(oItemOrItems: DOpusItem|DOpusVector<DOpusItem>): void;

}

declare var ADS: {
// interface IADSConstructor {
    /**
     * @param {string} streamName name to use, no : or $DATA necessary
     * @constructor
     */
    new(streamName: string): ADS;
}



namespace ads {
    const myName = 'ADS';
    const logger = libLogger.logger;
    const sprintf = sprintfjs.sprintf;

    class ADSFileAttr implements IADSFileAttr {
        setAttr: string;
        clearAttr: string;
        constructor(setAttr: string, clearAttr: string) {
            this.setAttr   = setAttr;
            this.clearAttr = clearAttr;
            return this;
        }
    }

    export class CachedItem implements ICachedItem {
        public readonly last_modify: number;
        public readonly last_modify_friendly: string;
        public readonly last_size: number;
        public readonly last_size_friendly: string;

        constructor(oItem: DOpusItem, modify?: Date, size?: number, ...args: any) {
            let _date = modify || new Date(oItem.modify);
            let _size = size || parseInt(''+oItem.size, 10);

            this.last_modify          = _date.valueOf();
            this.last_modify_friendly = this.last_modify.formatAsDateTimeCompact();
            this.last_size            = _size;
            this.last_size_friendly   = this.last_size.formatAsSize();
        }
    }


    // unfortunately I cannot check if a parameter is of type DOpusVector with
    // if (oParam instanceof DOpusVector)
    // so I had to encapsulate it with a custom object

    export class DOpusItemsVector {
        private items: DOpusVector<DOpusItem>;
        constructor () {
            this.items = DOpus.create().vector();
        }
        /**
         * @param {DOpusItem} oItem
         * @returns {DOpusItemsVector}
         */
        addItem (oItem: DOpusItem): DOpusItemsVector {
            this.items.push_back(oItem);
            return this;
        };
        /**
         * @returns {DOpusVector.<DOpusItem>}
         */
        getItems () {
            return this.items;
        };
    }

    export class DOpusItemsVectorOfMaps {
        private items: DOpusVector<DOpusMap>;
        constructor() {
            this.items = DOpus.create().vector();
        }
        /**
         * @param {DOpusItem} oItem
         * @param {any} oValue usually a CachedItem
         * @returns {DOpusItemsVectorOfMaps}
         * @see {CachedItem}
         */
        addItem (oItem: DOpusItem, oValue: ICachedItem | null): DOpusItemsVectorOfMaps {
            this.items.push_back(DOpus.create().map('key', oItem, 'val', oValue));
            return this;
        };
        /**
         * @returns {DOpusVector}
         */
        getItems () {
            return this.items;
        };
    }

    class DummyCache implements IMemCache {
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
    export const dummyCache = new DummyCache('dummy');



    // /**
    //  * WARNING: if you change the algorithm you will lose access to streams
    //  * and they will become orphans, until you switch back to the old one
    //  */
    // var hashStreamName = META_STREAM_NAME;
    // if (!hashStreamName) {
    //     g.abortWith(new exc.DeveloperStupidityException(sprintf('Cannot continue without a stream name: ' + hashStreamName), myName));
    // }

    export class Stream implements ADS {

        private streamName: string;
        private cache: IMemCache;

        constructor(streamName: string, cache: IMemCache) {
            this.streamName = streamName;
            this.cache = cache || dummyCache;

            // return new ADS(streamName);

        }

        getFileAttributes(oItem: DOpusItem): IADSFileAttr {
            // check the file attributes: Read-Only & System
            var oFile = oItem.open('m');
            var sSetAttr = '', sClearAttr = '';
            if (oItem.fileattr.archive)  { sClearAttr = 'a'; }
            if (oItem.fileattr.readonly) { oFile.setAttr('-r'); sSetAttr += 'r'; }
            if (oItem.fileattr.system)   { oFile.setAttr('-s'); sSetAttr += 's';}
            if (oItem.fileattr.hidden)   { oFile.setAttr('-h'); sSetAttr += 'h'; }
            return new ADSFileAttr(sSetAttr, sClearAttr);
        }

        hasHashStream(oItem: DOpusItem): boolean {
            var fnName = g.funcNameExtractor(arguments.callee, myName);
            logger.sverbose('%s -- oItem.name: %s', fnName, oItem.name);
            if (!doh.isFile(oItem)) return false;
            return fs.isValidPath(oItem.realpath + ':' + this.streamName);
        }

        read(oItem: DOpusItem): IResult<ICachedItem, string> {
            var fnName = g.funcNameExtractor(arguments.callee, myName);

            var filePath = ''+oItem.realpath,
                resCache = this.cache.getCacheVar(filePath),
                resContents;

            // check if cache is enabled and item is in cache
            if (resCache.isOk()) {
                // logger.sverbose('%s found in cache', oItem.name);
                resContents = resCache.ok;
            } else {
                // logger.sverbose('%s -- reading from disk: %s', fnName, oItem.name);
                var resRead = fs.readFile(filePath + ':' + this.streamName); // always string or false ion error
                if (resRead.isErr()) return g.ResultErr(resRead.err);
                resContents = resRead.ok;
                if (this.cache.isEnabled()) {
                    // checking with isEnabled() is not necessary for setCacheVar()
                    // as it silently ignores the call if cache is disabled,
                    // I only put it so that we can print the logger entry
                    logger.sverbose('%s -- adding missing %s to cache', fnName, oItem.name);
                    this.cache.setCacheVar(filePath, resContents);
                }
            }
            // convert to custom object
            var _tmp = JSON.parse(resContents);
            return g.ResultOk(new CachedItem(oItem, _tmp.last_modify, _tmp.last_size, _tmp.hash, _tmp.algorithm));
        }

        save(oItemOrItems: any, oCachedItemOrNull: ICachedItem | null): IResult<number, string> {
            var fnName = g.funcNameExtractor(arguments.callee, myName);

            var totalBytesWritten = 0;

            /** @type {DOpusVector} */
            var vec;
            if(oItemOrItems instanceof DOpusItemsVectorOfMaps) {
                vec = oItemOrItems.getItems();
            } else {
                vec = new DOpusItemsVectorOfMaps().addItem(oItemOrItems, oCachedItemOrNull).getItems();
            }

            doh.cmd.clearFiles();
            for(var i = 0; i < vec.length; i++) {
                /** @type {DOpusItem} */
                var oItem       = vec[i].get('key');
                var oCachedItem = vec[i].get('val');

                var filePath    = ''+oItem.realpath,
                    targetPath  = filePath + ':' + this.streamName,
                    origModDate = DateToDOpusFormat(oItem.modify);

                // check the file attributes: Read-Only & System
                var oFileAttrib = this.getFileAttributes(oItem);

                if (filePath.length > 240 ) {
                    filePath   = '\\\\?\\' + filePath;
                    targetPath = '\\\\?\\' + targetPath;
                }

                var resSaveFile = fs.saveFile(targetPath, JSON.stringify(oCachedItem));
                if (resSaveFile.isErr()) return g.ResultErr(sprintf('%s -- Cannot save to %s', fnName, targetPath));

                // reset the file date & attributes
                // doh.cmd.runCommand('SetAttr FILE="' + filePath + '" MODIFIED "' + origModDate + '" ATTR ' + oFileAttrib.setAttr + ' CLEARATTR ' + oFileAttrib.clearAttr);
                doh.cmd.addLine('SetAttr FILE="' + filePath + '" MODIFIED "' + origModDate + '" ATTR ' + oFileAttrib.setAttr + ' CLEARATTR ' + oFileAttrib.clearAttr);

                // use the original path without \\?\
                this.cache.setCacheVar(''+oItem.realpath, JSON.stringify(oCachedItem));

                totalBytesWritten += <number>resSaveFile.ok; // casting is ok, we check isErr() above
            }
            if (vec.length) doh.cmd.run();

            return g.ResultOk(totalBytesWritten);
        }

        remove(oItemOrItems: any): void {
            var fnName = g.funcNameExtractor(arguments.callee, myName);

            /** @type {DOpusVector.<DOpusItem>} */
            var vec;
            if(oItemOrItems instanceof DOpusItemsVector) {
                vec = oItemOrItems.getItems();
            } else {
                vec = new DOpusItemsVector().addItem(oItemOrItems).getItems();
            }

            doh.cmd.clearFiles();
            for(var i = 0; i < vec.length; i++) {
                /** @type {DOpusItem} */
                var oItem = vec[i];

                var filePath    = ''+oItem.realpath,
                    targetPath  = filePath + ':' + this.streamName,
                    origModDate = DateToDOpusFormat(oItem.modify);
                    // origModDate = oItem.modify.formatAsDateDOpus();
                logger.sverbose('%s -- Deleting %s and resetting modification date to: %s', fnName, oItem.realpath, origModDate);

                // get the current file attributes: Read-Only, System, Archive, Hidden
                var oFileAttrib = this.getFileAttributes(oItem);

                // use the original path without \\?\
                this.cache.delCacheVar(filePath);

                if (filePath.length > 240 ) {
                    filePath   = '\\\\?\\' + filePath;
                    targetPath = '\\\\?\\' + targetPath;
                }
                // delete the ADS stream, reset the modification date & file attributes
                doh.cmd.addLine('Delete /quiet /norecycle "' + targetPath + '"');
                doh.cmd.addLine('SetAttr FILE="' + filePath + '" MODIFIED "' + origModDate + '" ATTR ' + oFileAttrib.setAttr + ' CLEARATTR ' + oFileAttrib.clearAttr);
            }
            if (vec.length) doh.cmd.run();
        }

    }

}
