${Global.SCRIPT_NAME} turns DOpus to a full-fledged video/audio manager.

It supplies extended info columns & script fields, and script commands for multimedia files
which you can use everywhere these are available: Listers, InfoTips, Tile view, Rename Dialog...
...as long as the files are processed before.

'Processing' a file (UPDATE command) means storing crucial information about a file in ADS
which can be later queried faster, and combined & formatted for display.

It recognizes many container formats and codecs which DOpus supports only partially or not at all.

The values are supplied by the external program MediaInfo (CLI version)
which can be freely downloaded.

The values are NOT stored in the files themselves, as in MP3 ID3, Matroska, APE tags, etc.
but attached to the files.

This script uses ADS and metadata, and occasionally stream, interchangably.
Note: Streams are not to be confused with video or audio streams in the files.

"Attached"?
Windows NTFS supports the so-called Alternate Data Streams (ADS).
These are practically separate 'quasi-files' attached to their parent files.
0 or more ADS streams can be attached to a file.
These streams can be listed with "DIR /R" (CMD) or "DIR /:" (JPSoft TCC).

You might know ADS from files downloaded from Internet.
Whenever you download a file with IE/Edge, it appends a 'ZoneInformation' ADS to the file
and if you execute it Windows asks you before if you trust the file source and want to execute it.

More information about ADS can be found via a simple search "NTFS ADS", e.g.

https://en.wikipedia.org/wiki/NTFS#Alternate_data_streams_(ADS)
https://www.2brightsparks.com/resources/articles/ntfs-alternate-data-stream-ads.html
https://stealthbits.com/blog/ntfs-file-streams/
https://hshrzd.wordpress.com/2016/03/19/introduction-to-ads-alternate-data-streams/

Are ADS safe?
Normally when you edit the file content, the ADS content is not changed and vice versa,
that is, it is normally safe to edit the file and its stream(s) separately.
When you delete the parent file, its ADS are automatically deleted.

When you change the metadata stream's content, its parent file's modification timestamp may be updated,
however, this script allows you to keep the original timestamp (highly recommended).

ADS can be used for good and bad. Some malware can hide their code in ADS,
however, most modern antivirus software recognize this already.

On any non-NTFS file system this script will not work.
