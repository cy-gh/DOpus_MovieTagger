///<reference path='../_DOpusDefinitions.d.ts' />
namespace doh {

    export const name       = 'doh';
    export const dop        = DOpus;
    export const scr        = Script;
    export const dc         = DOpus.create();
    export const cmd        = DOpus.create().command();
    export const st         = DOpus.create().stringTools();
    export const fsu        = DOpus.fsUtil();
    export const sv         = Script.vars;
    export const shell      = new ActiveXObject('WScript.shell');
    export const dopusrt    = 'dopusrt /acmd';

    /** Shortcut for DOpus.output() @param {any} string */
    export function out (string: any) {
        dop.output(string);
    }
    /** DOpus.ClearOutput wrapper */
    export function clear () {
        dop.clearOutput();
    }
    /** DOpus.Delay wrapper @param {number} millisecs to sleep */
    export function delay (millisecs: number) {
        if (!millisecs) return;
        dop.delay(millisecs);
    }
    /** DOpus.dlg() wrapper @returns {DOpusDialog} */
    export function dlg () {
        return dop.dlg();
    }
    /**
     * util.fu.GetItem wrapper
     * @param {string} sPath file full path
     * @returns {DOpusItem} DOpus Item
     */
    export function getItem (path: string): DOpusItem {
        return fsu.getItem(path);
    }
    /**
     * @param {DOpusItem} oItem DOpus Item
     * @returns {boolean} true if DOpus item
     */
    export function isValidDOItem (oItem: DOpusItem): boolean {
        return (typeof oItem === 'object' && typeof oItem.realpath !== 'undefined' && typeof oItem.modify !== 'undefined');
    }
    /**
     * @param {DOpusItem} oItem DOpus Item
     * @returns {boolean} true if DOpus file, false if dir, reparse, junction, symlink
     */
    export function isFile (oItem: DOpusItem): boolean {
        return (typeof oItem === 'object' && oItem.realpath && !oItem.is_dir && !oItem.is_reparse && !oItem.is_junction && !oItem.is_symlink);
    }
    /**
     * @param {DOpusItem} oItem DOpus Item
     * @returns {boolean} true if DOpus directory, false if file, reparse, junction, symlink
     */
    export function isDir (oItem: DOpusItem): boolean {
        return (typeof oItem === 'object' && typeof oItem.realpath !== 'undefined' && oItem.is_dir === true);
    }
    /**
     * @param {DOpusItem} oItem DOpus Item
     * @returns {boolean} true if DOpus file or directory, false if reparse, junction, symlink
     */
    export function isDirOrFile (oItem: DOpusItem): boolean {
        return (typeof oItem === 'object' && oItem.realpath && !oItem.is_reparse && !oItem.is_junction && !oItem.is_symlink);
    }
    /**
     * @param {DOpusScriptCommandData} cmdData
     * @returns {boolean} true if DOpus command data
     */
    export function isValidDOCommandData (cmdData: DOpusScriptCommandData): boolean {
        return (cmdData.func && typeof cmdData.func.dlg === 'function');
    }
    /**
     * @param {DOpusScriptColumnData} oColData DOpus column data
     * @returns {boolean} true if DOpus column data
     */
    export function isValidDOColumnData (oColData: DOpusScriptColumnData): boolean {
        return (typeof oColData === 'object' && typeof oColData.value !== 'undefined' && typeof oColData.group !== 'undefined');
    }
    /**
     * @param {DOpusMap} oMap DOpus Map
     * @returns {boolean} true if DOpus Map
     */
    export function isValidDOMap (oMap: DOpusMap): boolean {
        return (typeof oMap === 'object' && typeof oMap.size === 'undefined' && typeof oMap.count !== 'undefined' && typeof oMap.length !== 'undefined' && oMap.count === oMap.length);
    }
    /**
     * @param {DOpusVector} oVector DOpus Vector
     * @returns {boolean} true if DOpus Vector
     */
    export function isValidDOVector (oVector: DOpusVector<any>): boolean {
        return (typeof oVector === 'object' && typeof oVector.capacity !== 'undefined' && typeof oVector.count !== 'undefined' && typeof oVector.length !== 'undefined' && oVector.count === oVector.length);
    }
    /**
     * @param {object} oAny any enumerable object, e.g. scriptCmdData.func.sourcetab.selected
     * @returns {boolean}
     */
    export function isValidDOEnumerable (oAny: object): boolean {
        try {
            var e = new Enumerator(oAny);
            return (e && typeof e.atEnd === 'function' && typeof e.moveNext === 'function');
        } catch(e) { return false; }
    }
    /** @param {DOpusScriptCommandData} cmdData @returns {string} current tab's path, always with trailing slash */
    export function getCurrentPath (cmdData: DOpusScriptCommandData): string {
        return (''+cmdData.func.sourceTab.path).normalizeTrailingBackslashes();
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function isTabDirty (cmdData: DOpusScriptCommandData) {
        return !!cmdData.func.sourceTab.dirty;
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getProgressBar (cmdData: DOpusScriptCommandData) {
        return cmdData.func.command.progress;
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getAllItems (cmdData: DOpusScriptCommandData) {
        return cmdData.func.sourceTab.all;
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getAllDirs (cmdData: DOpusScriptCommandData) {
        return cmdData.func.sourceTab.dirs;
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getAllFiles (cmdData: DOpusScriptCommandData) {
        return cmdData.func.sourceTab.files;
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getSelItems (cmdData: DOpusScriptCommandData) {
        return cmdData.func.sourceTab.selected;
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getSelDirs (cmdData: DOpusScriptCommandData) {
        return cmdData.func.sourceTab.selected_dirs;
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getSelFiles (cmdData: DOpusScriptCommandData) {
        return cmdData.func.sourceTab.selected_files;
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getSelFileAsItem (cmdData: DOpusScriptCommandData) {
        return fsu.getItem(new Enumerator(cmdData.func.sourceTab.selected_files).item());
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getSelDirAsItem (cmdData: DOpusScriptCommandData) {
        return fsu.getItem(new Enumerator(cmdData.func.sourceTab.selected_dirs).item());
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getSelectedAsItem (cmdData: DOpusScriptCommandData) {
        return fsu.getItem(new Enumerator(cmdData.func.sourceTab.selected).item());
    }
    /** all items, dirs, files - selstats takes checkbox mode into account @param {DOpusScriptCommandData} cmdData */
    export function getAllItemsCount (cmdData: DOpusScriptCommandData) {
        return cmdData.func.sourceTab.selstats.items;
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getAllDirsCount (cmdData: DOpusScriptCommandData) {
        return cmdData.func.sourceTab.selstats.dirs;
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getAllFilesCount (cmdData: DOpusScriptCommandData) {
        return cmdData.func.sourceTab.selstats.files;
    }
    /** selected items, dirs, files - selstats takes checkbox mode into account @param {DOpusScriptCommandData} cmdData */
    export function getSelItemsCount (cmdData: DOpusScriptCommandData) {
        return cmdData.func.sourceTab.selstats.selItems;
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getSelDirsCount (cmdData: DOpusScriptCommandData) {
        return cmdData.func.sourceTab.selstats.selDirs;
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getSelFilesCount (cmdData: DOpusScriptCommandData) {
        return cmdData.func.sourceTab.selstats.selFiles;
    }
    /** gets global (DOpus.Vars) var @param {any} key */
    export function getGlobalVar(key: any) {
        return dop.vars.get(key);
    }
    /** sets global (DOpus.Vars) var @param {any} key @param {any} val */
    export function setGlobalVar(key: any, val: any) {
        dop.vars.set(key, val);
    }
    /** @param {string} resourceName */
    export function loadResources(resourceName: string) {
        scr.loadResources(resourceName);
    }
    // removed the earlier Result dependency
    /** @param {string} path @returns {number|boolean} file size on success */
    export function getFileSize(path: string): number|false {
        var oItem = getItem(path);
        return oItem ? parseInt(''+oItem.size, 10) : false;
    }

}
