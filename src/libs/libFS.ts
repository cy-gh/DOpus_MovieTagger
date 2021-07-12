///<reference path='./libDOpusHelper.ts' />
///<reference path='./libLogger.ts' />
///<reference path='./libStopwatch.ts' />

namespace fs {

    const myName = 'fs';
    const logger = libLogger.current;

    // blob.copyFrom() and stringTools.decode() use different names
    const // FORMAT_FOR_COPY   = 'utf8',
          FORMAT_FOR_DECODE = 'utf-8';

    /**
     * Reads requested file contents (incl. ADS streams).
     *
     * Is compatible with extremely long paths, incl. > 255 chars.
     *
     * DO NOT PASS QUOTES, SINGLE OR DOUBLE - they will be automatically added.
     *
     * For format not all of "base64", "quoted", "auto"=not supplied, "utf-8", "utf-16", "utf-16-le", "utf-16-be" do work.
     *
     * The only ones which worked reliably in my tests are utf-8 & utf-16, since they're the only ones Blob.CopyFrom() supports.
     *
     * @example
     * contents = FS.readFile("Y:\\MyDir\\myfile.txt", FS.TEXT_ENCODING.utf16);
     * contents = FS.readFile("Y:\\MyDir\\myfile.txt:SecondStream", FS.TEXT_ENCODING.utf8);
     * @param {string} path file path to read, e.g. "Y:\\Path\\file.txt" or "Y:\\Path\\file.txt:CustomMetaInfo" for ADS
     * @param {string=} decodeFormat decoding format, utf-8, utf-16, etc.
     * @returns {IResult.<string, string>} file contents on success, error string on error
     */
    export function readFile(path:string, decodeFormat?:string): IResult<string, string> {
        const fname = readFile.fname = myName + '.readFile';

        if (!isValidPath(path)) { return g.ResultErr(g.sprintf('%s -- File does not exist: %s', fname, path)); }

        var fh = doh.fsu.openFile(path); // default read mode
        if(fh.error !== 0) return g.ResultErr(g.sprintf('%s -- File exists but cannot be read - error: %s, file: %s', fname, fh.error, path));

        try {
            var blob = fh.read();
        } catch(e) {
            return g.ResultErr(g.sprintf('%s -- FSUtil.Read() error: %s, file: %s', fname, e.description, path));
        }
        try {
            var res = ''+doh.st.decode(blob, decodeFormat||FORMAT_FOR_DECODE); // "utf-8" seems to be standard, "auto" does not work for me
        } catch(e) {
            return g.ResultErr(g.sprintf('%s -- StringTools.Decode() error: %s, file: %s', fname, e.description, path));
        }
        blob.free();
        fh.close();
        return g.ResultOk(res);
    }

    /**
     * Saves given contents to file (incl. ADS streams).
     *
     * Is compatible with extremely long paths, incl. > 255 chars.
     *
     * DO NOT PASS QUOTES, SINGLE OR DOUBLE - they will be automatically added.
     *
     * For format not all of "base64", "quoted", "auto"=not supplied, "utf-8", "utf-16", "utf-16-le", "utf-16-be" do work.
     *
     * The only ones which worked reliably in my tests are utf-8 & utf-16, since they're the only ones Blob.CopyFrom() supports.
     *
     * @example
     * numBytesWritten = FS.SaveFile("Y:\\MyDir\\myfile.txt", 'Hello World');
     * numBytesWritten = FS.SaveFile("Y:\\MyDir\\myfile.txt:CustomMetaInfo", encodeURI(new Date().getTime().toString()), FS.TEXT_ENCODING.utf16);
     * numBytesWritten = FS.SaveFile("Y:\\MyDir\\myfile.txt:CustomMetaInfo", encodeURI("{\"a\": 1}"), FS.TEXT_ENCODING.utf8);
     * @param {string} path file path to save
     * @param {string} contents contents
     * @returns {IResult.<number, string>} number of bytes written on success, error string on error
     */
     export function saveFile(path: string, contents: string): IResult<number, string> {
        const fname = saveFile.fname = myName + '.saveFile';

        // if (path.length > 240 && path.indexOf('\\\\?\\') === -1) {
        //   path   = '\\\\?\\' + path;
        // }

        // wa: wa - create a new file, always. If the file already exists it will be overwritten. (This is the default.)
        var fh = doh.fsu.openFile(path, 'wa');
        if(fh.error !== 0) {
            return g.ResultErr(g.sprintf('%s -- FSUtil.OpenFile() error: %s, file: %s', fname, fh.error, path));
        }
        try {
            var numBytesWritten = fh.write(contents);
            // var blob = doh.dc.blob();
            // blob.copyFrom(contents, FORMAT_FOR_COPY);  // seems to use implicitly utf-16, only available optional param is utf8
            // var numBytesWritten = fh.write(blob);
            logger.snormal('%s -- Written bytes: %d, orig length: %d, path: %s, contents:\n%s', fname, numBytesWritten, contents.length, path, contents);
            // blob.free();
            fh.close();
            return g.ResultOk(numBytesWritten);
        } catch(e) {
            fh.close();
            return g.ResultErr(g.sprintf('%s --  FSUtil.Write() error: %s, file: %s', fname, e.description, path));
        }
    }

    /**
     * checks if given path is valid
     * @param {string} path file path
     * @returns {boolean} true if file exists
     */
    export function isValidPath(path: string): boolean {
        const fname = isValidPath.fname = myName + '.isValidPath';
        return doh.fsu.exists(path);
    }


    /**
     * @param {Object} driveLetters object which maps driveLetter, e.g. Y: to the number of files found under it (this function ignores it)
     * @returns {IResult.<string, boolean>} drive type, e.g. HDD, SSD on success
     */
    export function detectDriveType(driveLetters: object): IResult<string, boolean> {
        const fname = detectDriveType.fname = myName + '.detectDriveType';
        var cmd;

        var ts = g.now();
        cmd = 'wmic logicaldisk get deviceid,volumeserialnumber > Y:\\test.txt';
        logger.sverbose('Running: %s', cmd);
        doh.shell.Run(cmd, 0, true); // 0: hidden, true: wait
        doh.out('WMIC Partition Query Duration: ' + (g.now() - ts) + ' ms');

        /**
         * First time:
         * - run wmic and get all drive letters and volume serial numbers
         * - run powershell and detect HDD/SSDs
         * - if any HDDs detected or some letters cannot be detected, ask user if the detection is correct
         * - put everything into a DOpus.Vars variable
         *
         * At every run:
         * - run wmic and get all drive letters and volume serial numbers
         * - check if the volume serial number is known for the target partitions
         * - if known use the previously detected drive type (without running powershell)
         * - if unknown, run powershell again for the drive letter
         * - if an HDD is detected or it cannot be detected, ask user if the detection is correct
         */
        var driveType;
        logger.snormal(SW.stopwatch.startAndPrint(fname, 'Drive Type Detection'));
        for (var driveLetter in driveLetters) {
            // var tempPSOutFile = g.SYSTEMP + '\\' + GlobalCMT.SCRIPT_NAME + '.tmp.txt';
            var tempPSOutFile = g.SYSTEMP + '\\' + g.getUniqueID() + '.tmp.txt';
            // cmd = 'PowerShell.exe "Get-Partition –DriveLetter ' + driveLetter.slice(0,1) + ' | Get-Disk | Get-PhysicalDisk | Select MediaType | Select-String \'(HDD|SSD)\'" -encoding ascii > "' + tempPSOutFile + '"';
            cmd = 'PowerShell.exe ( "Get-Partition -DriveLetter ' + driveLetter.slice(0,1) + ' | Get-Disk | Get-PhysicalDisk | Select MediaType | Select-String \'(HDD|SSD|Unspecified)\' -encoding ascii | Out-String" ).trim() > "' + tempPSOutFile + '"';
            logger.sforce('%s -- Running: %s', fname, cmd);
            doh.shell.Run(cmd, 0, true); // 0: hidden, true: wait

            var res = readFile(tempPSOutFile, 'utf-16');

            doh.cmd.runCommand('Delete /quiet /norecycle "' + tempPSOutFile + '"');
            if (res.isErr() || !res.ok) {
                logger.snormal('%s -- Could not determine disk type of %s, assuming SSD', fname, driveLetter);
            } else {
                driveType = res.ok.trim().replace(/.*\{MediaType=([^}]+)\}.*/mg, '$1').trim();
                logger.sforce('%s -- Detemined disk type for %s is %s', fname, driveLetter, driveType);
                // if (driveType === 'HDD' && command.maxcount > REDUCE_THREADS_ON_HDD_TO) {
                //   var driveDetectMsg = libSprintfjs.sprintf('This drive seems to be an %s.\n\nThe script will automatically reduce the number of threads to avoid disk thrashing.\nOld # of Threads: %d\nNew # of Threads : %d\n\nIf you press Cancel, the old value will be used instead.\nIs this drive type correct?', driveType, command.maxcount, REDUCE_THREADS_ON_HDD_TO);
                //   var result = showMessageDialog(cmdData.func.dlg(), driveDetectMsg, 'Drive Type detection', 'OK|Cancel');
                //   if (result && command.maxcount > 1) command.maxcount = REDUCE_THREADS_ON_HDD_TO;
                // }
            }
        }
        logger.snormal(SW.stopwatch.stopAndPrint(fname, 'Drive Type Detection'));
        return driveType ? g.ResultOk(driveType) : g.ResultErr(true);
    }

}
