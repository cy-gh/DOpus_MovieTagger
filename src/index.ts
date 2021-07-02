// @ts-check
/* eslint quotes: ['error', 'single'] */
/* eslint-disable no-inner-declarations */
/* global ActiveXObject Enumerator DOpus Script */
/* eslint indent: [2, 4, {"SwitchCase": 1}] */
///<reference path='./_DOpusDefinitions.d.ts' />
///<reference path='./_Helpers.d.ts' />
///<reference path='./_IMemCache.d.ts' />
///<reference path='./libs/libDOpusHelper.ts' />
///<reference path='./libs/libExceptions.ts' />
///<reference path='./libs/libLogger.ts' />
///<reference path='./libs/formatters.ts' />
///<reference path='./libs/libGlobal.ts' />



// use CTRL-SHIFT-B to build - you must have npx.cmd in your path

// called by DOpus
/** @param {DOpusScriptInitData=} initData */
// eslint-disable-next-line no-unused-vars
function OnInit(initData: DOpusScriptInitData) {
    DOpus.clearOutput();
    // let logger1 = new libLogger.CLogger(libLogger.LOGLEVEL.NORMAL);
    let logger = libLogger.logger;
    logger.force("This variant does not work with node anymore...");
    logger.force('No import or require in this version but it works with DOpus');

    logger.sforce('%s', 'foo');
    logger.sforce('', 'foo2');
    logger.sforce('', new Date().toLocaleString());
    logger.sforce('', new Date().getTime().formatAsDateDOpus());
    logger.sforce('', new Date().getTime().formatAsDateISO());
    logger.sforce('', new Date().getTime().formatAsDateTimeCompact());
    logger.sforce('', new Date().getTime().formatAsDuration());

    var oItem = doh.fsu.getItem('Y:\\VeraCrypt.rar');
    var id = oItem.modify;
    logger.force('id: ' + id);
    var d = new Date('2021-06-28 T18:09:04.206Z');
    // var d1 = doh.dc.date('D2021-06-28 T18:09:04');
    // var d2 = doh.dc.date('2021-06-28 T18:09:04.206Z');
    // var d3 = doh.dc.date(d.getTime());
    var d1 = doh.dc.date(id);
    var d2 = doh.dc.date(new Date());
    var d3 = doh.dc.date(new Date().valueOf());

    logger.sforce('d1: ' + d1);
    logger.sforce('d2: ' + d2);
    logger.sforce('d3: ' + d3);
    logger.sforce('d1: ' + d1 + '\t' + d1.format('D#yyyy-MM-dd T#HH:mm:ss'));
    logger.sforce('d2: ' + d2 + '\t' + d2.format('D#yyyy-MM-dd T#HH:mm:ss'));
    logger.sforce('d3: ' + d3 + '\t' + d3.format('D#yyyy-MM-dd T#HH:mm:ss'));

    DOpus.output('myname: ' + g.funcNameExtractor(OnInit));
    DOpus.output('unique simple: ' + g.getUniqueID());
    DOpus.output('unique non-simple: ' + g.getUniqueID(false));
    DOpus.output(libSprintfjs.sprintf('%s: %d', 'prefix', 12))
    try {
        throw new exc.NotImplementedYetException('this is the message', 'OnInit');
    } catch(e) {
        DOpus.output(JSON.stringify(e, null, 4));
    }
    class cache implements IMemCache {
        public id: string;

        constructor(id: string) {
            this.id = id;
        }
        enable(): void {
            throw new Error("Method not implemented.");
        }
        disable(): void {
            throw new Error("Method not implemented.");
        }
        isEnabled(id?: string): boolean {
            throw new Error("Method not implemented.");
        }
        getCache(id?: string): IResult<DOpusMap, boolean> {
            throw new Error("Method not implemented.");
        }
        clearCache(id?: string): void {
            throw new Error("Method not implemented.");
        }
        getCacheCount(id?: string): IResult<number, boolean> {
            throw new Error("Method not implemented.");
        }
        getCacheVar(k: any, id?: string): IResult<any, boolean> {
            throw new Error("Method not implemented.");
        }
        setCacheVar(k: any, v: any, id?: string): IResult<any, boolean> {
            throw new Error("Method not implemented.");
        }
        delCacheVar(k: any, id?: string): IResult<any, boolean> {
            throw new Error("Method not implemented.");
        }

    }
    let c = new cache('test');
    c.id = 'foo';

    // let adsStream = new ads.Stream('SHA1');
    // DOpus.output(adsStream.hasHashStream(doh.getItem('Y:\\simple.txt')));

    DOpus.output('script finished');


}
