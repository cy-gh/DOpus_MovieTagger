///<reference path='../std/libStdDev.ts' />
///<reference path='./libDOpusHelper.ts' />

interface IDownloadedFile {
    size: number;
    content: string;
}

namespace url {
    const myName = 'url';

    const logger = libLogger.current;

    /**
     * @param {string} sURL
     * @returns {IResult.<IDownloadedFile, string>}
     */
    export function getRaw(sURL: string): IResult<IDownloadedFile, string> {
        const fname = getRaw.fname = myName + '.getRaw';

        // documentation at
        // https://docs.microsoft.com/en-us/previous-versions/windows/desktop/ms760305(v=vs.85)

        // var xhr = new ActiveXObject('WinHttp.WinHttpRequest.5.1'); // this does not return a readyState or responseBody
        var xhr = new ActiveXObject('Msxml2.XMLHTTP.6.0');

        xhr.open('HEAD', sURL);
        xhr.send();
        var iFileSize = xhr.getResponseHeader('Content-Length');

        xhr.open('GET', sURL, false); // false: symchronously
        // xhr.setRequestHeader('Accept', '*/*');
        // xhr.setRequestHeader('Accept-Encoding', '');
        // xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0');
        xhr.send();

        if(xhr.status != 200) {
            return g.ResultErr('Error during GET, status: ' + xhr.status + ', URL: ' + sURL)
        } else {
            logger.sforce('%s -- response headers:\n%s', fname, xhr.getAllResponseHeaders());
            return g.ResultOk({ size: iFileSize, content: xhr.responseBody });
        }
    }

    /**
     * @param {string} sURL
     * @returns {IResult.<Object, string>}
     */
    export function getFromURL(sURL: string): IResult<object, string> {
        const fname = getFromURL.fname = myName + '.getFromURL';

        var resDownload = getRaw(sURL);
        if (resDownload.isOk()) {
            try {
                return g.ResultOk(JSON.parse((<IDownloadedFile>resDownload.ok).content));
            } catch(e) {
                return g.ResultErr('Error during response parse, URL: ' + sURL);
            }
        } else {
            return resDownload;
        }
    }

    /**
     *
     * @param {number} iSize size of input string, should have been received from Content-Length
     * @param {string} xBinaryString binary string
     * @returns {string} base64-encoded string
     */
    export function getAsBase64(iSize: number, xBinaryString: string): string {
        const fname = getAsBase64.fname = myName + '.getAsBase64';
        var blob = DOpus.create().blob(iSize),
            st   = DOpus.create().stringTools();
        blob.copyFrom(xBinaryString);
        var out = ''+st.encode(blob, 'base64');
        return out;
    }
}
