///<reference path='./libDOpusHelper.ts' />
///<reference path='./libLogger.ts' />
///<reference path='./libStopwatch.ts' />

namespace fs {

    const myName = 'fs';
    const logger = libLogger.current;

    // blob.copyFrom() and stringTools.decode() use different names
    // const FORMAT_FOR_COPY   = 'utf8';
    const FORMAT_FOR_DECODE = 'utf-8';
    export const LONG_PATH_BOUNDARY = 240;


    /** Checks given path string and makes it long path compatible */
    export function makeLongSafe(path: string) {
        return path.length > LONG_PATH_BOUNDARY && path.indexOf('\\\\?\\') === -1
            ? '\\\\?\\' + path
            : path;
    }

    /** Checks if given path is valid */
    export function isValidPath(path: string) {
        return g.fsu.exists(makeLongSafe(path));
    }

    /**
     * Reads requested file contents (incl. ADS streams).
     *
     * Is compatible with extremely long paths, incl. > 255 chars.
     *
     * **Do not pass quotes single or double**, they will be added automatically.
     *
     * For format not all of "base64", "quoted", "auto"=not supplied, "utf-8", "utf-16", "utf-16-le", "utf-16-be" do work.
     *
     * The only ones which worked reliably in my tests are utf-8 & utf-16, since they're the only ones Blob.CopyFrom() supports.
     *
     * @example
     * ```ts
     * contentsRes = FS.readFile("Y:\\MyDir\\myfile.txt", FS.TEXT_ENCODING.utf16);
     * contentsRes = FS.readFile("Y:\\MyDir\\myfile.txt:SecondStream", FS.TEXT_ENCODING.utf8);
     * ```
     * @param {string} path file path to read, e.g. "Y:\\Path\\file.txt" or "Y:\\Path\\file.txt:CustomMetaInfo" for ADS
     * @param {string=} decodeFormat decoding format, utf-8, utf-16, etc.
     * @returns {IResult.<string, string>} file contents on success, error string on error
     */
    export function readFile(path:string, decodeFormat?:string): IResult<string, IException<ex>> {
        const fname = readFile.fname = myName + '.readFile';
        if (!isValidPath(path)) {
            return Exc(ex.FileNotFound, fname, 'File does not exist: ' + path);
        }

        const fh = g.fsu.openFile(makeLongSafe(path)); // default read mode
        if(fh.error !== 0) {
            return Exc(ex.FileRead, fname, g2.sprintf('File exists but cannot be read - error: %s, file: %s', fh.error, path));
        }

        let blob: DOpusBlob;
        try {
            blob = fh.read();
        } catch(e) {
            return Exc(ex.BlobReadInto, fname, g2.sprintf('Read error: %s, file: %s', e.description, path));
        } finally {
            fh.close();
        }

        try {
            return g.ResultOk(''+g.st.decode(blob, decodeFormat||FORMAT_FOR_DECODE)); // "utf-8" seems to be standard, "auto" does not work for me
        } catch(e) {
            return Exc(ex.StringDecode, fname, g2.sprintf('StringTools.Decode() error: %s, file: %s', e.description, path));
        } finally {
            blob.free();
            fh.close();
        }
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
     * ```ts
     * numBytesWrittenRes = FS.SaveFile("Y:\\MyDir\\myfile.txt", 'Hello World');
     * numBytesWrittenRes = FS.SaveFile("Y:\\MyDir\\myfile.txt:CustomMetaInfo", encodeURI(new Date().getTime().toString()), FS.TEXT_ENCODING.utf16);
     * numBytesWrittenRes = FS.SaveFile("Y:\\MyDir\\myfile.txt:CustomMetaInfo", encodeURI("{\"a\": 1}"), FS.TEXT_ENCODING.utf8);
     * ```
     * @param {string} path file path to save
     * @param {string} contents contents
     * @returns {IResult.<number, string>} number of bytes written on success, error string on error
     */
     export function saveFile(path: string, contents: string): IResult<number, IException<ex>> {
        const fname = saveFile.fname = myName + '.saveFile';

        // wa: wa - create a new file, always. If the file already exists it will be overwritten. (This is the default.)
        const fh = g.fsu.openFile(makeLongSafe(path), 'wa');
        if(fh.error !== 0) {
            return Exc(ex.FileCreate, fname, g2.sprintf('File create error: %s, file: %s', fh.error, path))
        }
        try {
            const numBytesWritten = fh.write(contents);
            logger.snormal('%s -- Written bytes: %d, orig length: %d, path: %s, contents:\n%s', fname, numBytesWritten, contents.length, path, contents);
            return g.ResultOk(numBytesWritten);
        } catch(e) {
            return Exc(ex.FileWrite, fname, g2.sprintf('FSUtil.Write() error: %s, file: %s', e.description, path));
        } finally {
            fh.close();
        }
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
        g.shell.Run(cmd, 0, true); // 0: hidden, true: wait
        g.out('WMIC Partition Query Duration: ' + (g.now() - ts) + ' ms');

        /**
            First time:
            - run wmic and get all drive letters and volume serial numbers
            - run powershell and detect HDD/SSDs
            - if any HDDs detected or some letters cannot be detected, ask user if the detection is correct
            - put everything into a DOpus.Vars variable

            At every run:
            - run wmic and get all drive letters and volume serial numbers
            - check if the volume serial number is known for the target partitions
            - if known use the previously detected drive type (without running powershell)
            - if unknown, run powershell again for the drive letter
            - if an HDD is detected or it cannot be detected, ask user if the detection is correct
         */
        var driveType;
        for (var driveLetter in driveLetters) {
            var tempPSOutFile = g.SYSTEMP + '\\' + g.getUniqueID() + '.tmp.txt';
            cmd = 'PowerShell.exe ( "Get-Partition -DriveLetter ' + driveLetter.slice(0,1) + ' | Get-Disk | Get-PhysicalDisk | Select MediaType | Select-String \'(HDD|SSD|Unspecified)\' -encoding ascii | Out-String" ).trim() > "' + tempPSOutFile + '"';
            logger.sforce('%s -- Running: %s', fname, cmd);
            g.shell.Run(cmd, 0, true); // 0: hidden, true: wait

            var res = readFile(tempPSOutFile, 'utf-16');

            g.cmd.runCommand('Delete /quiet /norecycle "' + tempPSOutFile + '"');
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
        return driveType ? g.ResultOk(driveType) : g.ResultErr(true);
    }

}
