///<reference path='../std/libStdDev.ts' />

namespace doh {

    export const name       = 'doh';
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
        return DOpus.fsUtil().getItem(new Enumerator(cmdData.func.sourceTab.selected_files).item());
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getSelDirAsItem (cmdData: DOpusScriptCommandData) {
        return DOpus.fsUtil().getItem(new Enumerator(cmdData.func.sourceTab.selected_dirs).item());
    }
    /** @param {DOpusScriptCommandData} cmdData */
    export function getSelectedAsItem (cmdData: DOpusScriptCommandData) {
        return DOpus.fsUtil().getItem(new Enumerator(cmdData.func.sourceTab.selected).item());
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
    // removed the earlier Result dependency
    /** @param {string} path @returns {number|boolean} file size on success */
    export function getFileSize(path: string): number|false {
        var oItem = DOpus.fsUtil().getItem(path);
        return oItem ? parseInt(''+oItem.size, 10) : false;
    }

}
