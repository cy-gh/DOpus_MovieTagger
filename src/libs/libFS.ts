///<reference path='./libDOpusHelper.ts' />
///<reference path='./libExceptions.ts' />
///<reference path='./libLogger.ts' />
///<reference path='./libStopwatch.ts' />

namespace fs {

    const myName = 'fs';
    const logger = libLogger.logger;

    // blob.copyFrom() and stringTools.decode() use different names
    const // FORMAT_FOR_COPY   = 'utf8',
          FORMAT_FOR_DECODE = 'utf-8';

    /**
     * reads requested file contents (incl. ADS streams)
     * is compatible with extremely long paths, incl. > 255 chars
     *
     * DO NOT PASS QUOTES, SINGLE OR DOUBLE - they will be automatically added
     *
     * for format not all of "base64", "quoted", "auto"=not supplied, "utf-8", "utf-16", "utf-16-le", "utf-16-be" do work
     * the only ones which worked reliably in my tests are utf-8 & utf-16, since they're the only ones Blob.CopyFrom() supports
     * @example
     * contents = FS.readFile("Y:\\MyDir\\myfile.txt", FS.TEXT_ENCODING.utf16);
     * contents = FS.readFile("Y:\\MyDir\\myfile.txt:SecondStream", FS.TEXT_ENCODING.utf8);
     * @param {string} path file path to read, e.g. "Y:\\Path\\file.txt" or "Y:\\Path\\file.txt:CustomMetaInfo" for ADS
     * @param {string=} decodeFormat decoding format, utf-8, utf-16, etc.
     * @returns {IResult.<string, string>} file contents on success, error string on error
     */
    export function readFile(path:string, decodeFormat?:string): IResult<string, string> {
        const fnName = g.funcNameExtractor(arguments.callee, myName);

        if (!isValidPath(path)) { return g.ResultErr(); }

        var fh = doh.fsu.openFile(path); // default read mode
        if(fh.error !== 0) return g.ResultErr(g.sprintf('%s -- File exists but cannot be read - error: %s, file: %s', fnName, fh.error, path));

        try {
            var blob = fh.read();
        } catch(e) {
            return g.ResultErr(g.sprintf('%s -- FSUtil.Read() error: %s, file: %s', fnName, e.description, path));
        }
        try {
            var res = ''+doh.st.decode(blob, decodeFormat||FORMAT_FOR_DECODE); // "utf-8" seems to be standard, "auto" does not work for me
        } catch(e) {
            return g.ResultErr(g.sprintf('%s -- StringTools.Decode() error: %s, file: %s', fnName, e.description, path));
        }
        blob.free();
        fh.close();
        return g.ResultOk(res);
    }

    /**
     * saves given contents to file (incl. ADS streams)
     * is compatible with extremely long paths, incl. > 255 chars
     *
     * DO NOT PASS QUOTES, SINGLE OR DOUBLE - they will be automatically added
     *
     * for format not all of "base64", "quoted", "auto"=not supplied, "utf-8", "utf-16", "utf-16-le", "utf-16-be" do work
     * the only ones which worked reliably in my tests are utf-8 & utf-16, since they're the only ones Blob.CopyFrom() supports
     * @example
     * numBytesWritten = FS.SaveFile("Y:\\MyDir\\myfile.txt", 'Hello World');
     * numBytesWritten = FS.SaveFile("Y:\\MyDir\\myfile.txt:CustomMetaInfo", encodeURI(new Date().getTime().toString()), FS.TEXT_ENCODING.utf16);
     * numBytesWritten = FS.SaveFile("Y:\\MyDir\\myfile.txt:CustomMetaInfo", encodeURI("{\"a\": 1}"), FS.TEXT_ENCODING.utf8);
     * @param {string} path file path to save
     * @param {string} contents contents
     * @returns {IResult.<number, string>} number of bytes written on success, error string on error
     */
     export function saveFile(path: string, contents: string): IResult<number, string> {
        const fnName = g.funcNameExtractor(arguments.callee, myName);

        // if (path.length > 240 && path.indexOf('\\\\?\\') === -1) {
        //   path   = '\\\\?\\' + path;
        // }

        // wa: wa - create a new file, always. If the file already exists it will be overwritten. (This is the default.)
        var fh = doh.fsu.openFile(path, 'wa');
        if(fh.error !== 0) {
            return g.ResultErr(g.sprintf('%s -- FSUtil.OpenFile() error: %s, file: %s', fnName, fh.error, path));
        }
        try {
            var numBytesWritten = fh.write(contents);
            // var blob = doh.dc.blob();
            // blob.copyFrom(contents, FORMAT_FOR_COPY);  // seems to use implicitly utf-16, only available optional param is utf8
            // var numBytesWritten = fh.write(blob);
            logger.snormal('%s -- Written bytes: %d, orig length: %d, path: %s, contents:\n%s', fnName, numBytesWritten, contents.length, path, contents);
            // blob.free();
            fh.close();
            return g.ResultOk(numBytesWritten);
        } catch(e) {
            fh.close();
            return g.ResultErr(g.sprintf('%s --  FSUtil.Write() error: %s, file: %s', fnName, e.description, path));
        }
    }

    /**
     * checks if given path is valid
     * @param {string} path file path
     * @returns {boolean} true if file exists
     */
    export function isValidPath(path: string): boolean {
        return doh.fsu.exists(path);
    }

    /**
     * @example
     * var X = FS.fileTail('Y:\\MyFile.txt', 15000, 1000);
     * do {
     *   var linesRead = X.read();
     *   if (!linesRead.isOK()) continue;
     *   logger.sforce('lines: %s', linesRead.ok);
     * } while(linesRead.isValid());
     *
     * // do not use while(Result.isOK()), use isValid() instead,
     * // because isValid() allows 0,'',{}... as OK value, whereas isOK() does not
     * // another alternative is obviously while(!linesRead.isErr())
     * @param {string} filepath
     * @param {number} maxwait in millisecs
     * @param {number=} delayBetweenRetries in millisecs, default 10
     * @returns {{read: function}}
     * @deprecated
     */
    // export
    function fileTail(filepath: string, maxwait: number, delayBetweenRetries?: number): { read: Function; } {
        const fnName = g.funcNameExtractor(arguments.callee, myName);

        var swid    = g.sprintf('%s-%d-%s', fnName, g.now(), filepath),
            filePtr = 0;
        let delay = delayBetweenRetries || 10;

        SW.stopwatch.start(swid);

        /**
         * Unfortunately we have to open and close the file every time
         * because the file will most likely grow since we opened it
         * but File.Seek() does not allow us to seek beyond the original file size
         * and that way we cannot get the tail lines.
         * @returns {Result}
         */
        return {
            read: function() {
                if (SW.stopwatch.getElapsed(swid) > maxwait) {
                    SW.stopwatch.stop(swid);
                    logger.sforce('%s -- timed out', fnName);
                    return g.ResultOk(''); // timed out => empty string
                }
                doh.delay(delay);

                logger.sforce('%s -- monitoring file: %s', fnName, filepath);

                var fh = doh.fsu.openFile(filepath);
                if (fh.error) return g.ResultErr(g.sprintf('%s -- Cannot open file %s, Error: %s', fnName, fh.error));

                var size = doh.getFileSize(filepath);
                if (size === false) {
                    // this should never happen, we already opened the file
                    throw new exc.FileReadException('File size cannot be queried: ' + filepath, fnName);
                }
                if (filePtr >= size) return g.ResultErr(g.sprintf('%s -- File has been truncated since last attempt, last size: %d, now: %d', fnName, filePtr, size));

                fh.seek(filePtr);
                logger.sforce('%s -- File change detected -- filesize: %d, filePtr: %d', fnName, size, filePtr);

                var blob         = doh.dc.blob(),
                    numBytesRead = fh.read(blob);
                if (!numBytesRead) return g.ResultErr(g.sprintf('%s -- File change detected but cannot read lines: %d', fnName, numBytesRead));

                var newLines = doh.st.decode(blob, FORMAT_FOR_DECODE);

                filePtr = size;
                fh.close();
                logger.sforce('%s -- Read %s new bytes', fnName, numBytesRead);
                // return g.ResultOk(newLines);
                return new g.Result(newLines, false);
            }
        };
    }

    /**
     * @param {Object} driveLetters object which maps driveLetter, e.g. Y: to the number of files found under it (this function ignores it)
     * @returns {IResult.<string, boolean>} drive type, e.g. HDD, SSD on success
     */
    export function detectDriveType(driveLetters: object): IResult<string, boolean> {
        const fnName = g.funcNameExtractor(arguments.callee);
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
        logger.snormal(SW.stopwatch.startAndPrint(fnName, 'Drive Type Detection'));
        for (var driveLetter in driveLetters) {
            // var tempPSOutFile = g.SYSTEMP + '\\' + GlobalCMT.SCRIPT_NAME + '.tmp.txt';
            var tempPSOutFile = g.SYSTEMP + '\\' + g.getUniqueID() + '.tmp.txt';
            // cmd = 'PowerShell.exe "Get-Partition –DriveLetter ' + driveLetter.slice(0,1) + ' | Get-Disk | Get-PhysicalDisk | Select MediaType | Select-String \'(HDD|SSD)\'" -encoding ascii > "' + tempPSOutFile + '"';
            cmd = 'PowerShell.exe ( "Get-Partition -DriveLetter ' + driveLetter.slice(0,1) + ' | Get-Disk | Get-PhysicalDisk | Select MediaType | Select-String \'(HDD|SSD|Unspecified)\' -encoding ascii | Out-String" ).trim() > "' + tempPSOutFile + '"';
            logger.sforce('%s -- Running: %s', fnName, cmd);
            doh.shell.Run(cmd, 0, true); // 0: hidden, true: wait

            var res = readFile(tempPSOutFile, 'utf-16');

            doh.cmd.runCommand('Delete /quiet /norecycle "' + tempPSOutFile + '"');
            if (res.isErr() || !res.ok) {
                logger.snormal('%s -- Could not determine disk type of %s, assuming SSD', fnName, driveLetter);
            } else {
                driveType = res.ok.trim().replace(/.*\{MediaType=([^}]+)\}.*/mg, '$1').trim();
                logger.sforce('%s -- Detemined disk type for %s is %s', fnName, driveLetter, driveType);
                // if (driveType === 'HDD' && command.maxcount > REDUCE_THREADS_ON_HDD_TO) {
                //   var driveDetectMsg = libSprintfjs.sprintf('This drive seems to be an %s.\n\nThe script will automatically reduce the number of threads to avoid disk thrashing.\nOld # of Threads: %d\nNew # of Threads : %d\n\nIf you press Cancel, the old value will be used instead.\nIs this drive type correct?', driveType, command.maxcount, REDUCE_THREADS_ON_HDD_TO);
                //   var result = showMessageDialog(cmdData.func.dlg(), driveDetectMsg, 'Drive Type detection', 'OK|Cancel');
                //   if (result && command.maxcount > 1) command.maxcount = REDUCE_THREADS_ON_HDD_TO;
                // }
            }
        }
        logger.snormal(SW.stopwatch.stopAndPrint(fnName, 'Drive Type Detection'));
        return driveType ? g.ResultOk(driveType) : g.ResultErr(true);
    }

}
