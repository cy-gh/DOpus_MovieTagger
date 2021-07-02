///<reference path='../_DOpusDefinitions.d.ts' />


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
    public readonly last_modify          : number;
    public readonly last_modify_friendly : string;
    public readonly last_size            : number;
    public readonly last_size_friendly   : string;

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


// interface ICustomDOpusVector extends DOpusVector {

//     public readonly items: DOpusVector<T>;

//     // /**
//     //  * this is kind of a constructor
//     //  * @returns {DOpusVector<T>}
//     //  */
//     // create(): DOpusVector<T>;

//     /**
//      * @param {T} item
//      * @returns {DOpusVector<T>;} same object after adding new item
//      */
//     addItem(item: T): DOpusVector<T>;

//     /**
//      * @returns {DOpusVector<T>;}
//      */
//     getItems(): DOpusVector<T>;
// }
// declare var ICustomDOpusVector: {
//     new(t: T): ICustomDOpusVector<T>
// }


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
    save(oItemOrItems: DOpusItem|ICustomDOpusVector<DOpusMap>, oCachedItemOrNull: ICachedItem|null): IResult<number, string>;

    /**
     * deletes ADS data, directly deletes "file:stream"
     * removes item from cache if enabled
     * @param {DOpusItem|ICustomDOpusVector<DOpusItem>} oItemOrItems DOpus Item object or Items Vector
     */
    remove(oItemOrItems: DOpusItem|ICustomDOpusVector<DOpusItem>): void;

}

declare var ADS: {
// interface IADSConstructor {
    /**
     * @param {string} streamName name to use, no : or $DATA necessary
     * @constructor
     */
    new(streamName: string): ADS;
}
