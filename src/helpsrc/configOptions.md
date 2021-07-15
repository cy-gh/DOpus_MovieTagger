# Config Options

For the JSON formatted variables, please keep these in mind:

* JSON strings must be double-quoted ("); single quotes (') will be rejected by JSON parser
* The last line of arrays/objects may NOT have a trailing comma
* No comments whatsoever



| Name                              | Type | Default | Remarks |
| --------------------------------- | ---------- | ------------- | ------- |
| DEBUG_LEVEL                       | enum | ERROR | Level of output messages in the Script Log (aka Output Log) shown by the script.<br /><br />Unless you are adventurous, do not set it above WARN, i.e. NORMAL, INFO, VERBOSE emita ton of information and might freeze your PC/DOpus.<br /><br />The log can be opened by via:<br />* View -> Output Window<br />* by the command `Set UTILITY=OtherLog,Toggle`<br />* by opening Find, Synchronize, etc. and choosing "Other Log" in the "Utility Panel" dropdown |
| FORCE_REFRESH_AFTER_UPDATE        | boolean | true | Automatically refresh the current lister after changes.<br /><br />It keeps the current selection. |
| MEDIAINFO_PATH                    | string | /programfilesx86/MediaInfo/MediaInfo.exe | Path to MediaInfo portable CLI.<br /><br />It can be downloaded from [https://mediaarea.net/en/MediaInfo/Download/Windows](https://mediaarea.net/en/MediaInfo/Download/Windows) |
| TEMP_FILES_DIR                    | string | %TEMP% | Temporary directory, in which temporary JSON outputs from MediaInfo are stored.<br /><br />They are immediately deleted after a file has been processed.<br /><br />This is ignored in Templess Mode (see below). |
| TEMPLESS_MODE                     | boolean | false | *Experimental:*<br /><br />In this mode, MediaInfo outputs are read into the script without using temporary files.<br /><br />This is a highly experimental feature and uses temporary (volatile) environment variables to pass the data from the command output to DOpus.<br /><br />If you are lucky, it might work just as fast as, if not faster than the normal mode using temp-files. If not, disable it again. |
| TEMPLESS_CHUNK_SIZE               | number | 32768 | Experimental:<br /><br />Determines how big the chunks, i.e. volatile envvar blocks, should be. Windows has certain limitations on command line and envvar lengths. If templess mode works mostly for you, you can increase the value even further.<br /><br />The default value is chosen very conservatively. |
| KEEP_ORIG_MODTS                   | boolean | true | |
| CACHE_ENABLED                     | boolean | true | |
| TOGGLEABLE_FIELDS_ESSENTIAL       | string[] as json | [<br/>  "MExt_HasMetadata",<br/>  "MExt_NeedsUpdate",<br/>  "MExt_TotalBitrate",<br/>  "MExt_VideoCodec",<br/>  "MExt_VideoBitrate",<br/>  "MExt_AudioCodec",<br/>  "MExt_AudioBitrate",<br/>  "MExt_CombinedDuration",<br/>  "MExt_VDimensions",<br/>  "MExt_VResolution",<br/>  "MExt_VFrameRate",<br/>  "MExt_VARCombined",<br/>  "MExt_MultiAudio",<br/>  "MExt_AudioChannels",<br/>  "MExt_AudioLang",<br/>  "MExt_AudioBitrateMode",<br/>  "MExt_AudioCompressionMode",<br/>  "MExt_HasReplayGain",<br/>  "MExt_VBitratePerPixel",<br/>  "MExt_SubtitleLang"<br/>] | |
| TOGGLEABLE_FIELDS_ESSENTIAL_AFTER | string | Comments | |
| TOGGLEABLE_FIELDS_OPTIONAL        | string[] (as json) | [<br>    "MExt_GrossByterate",<br>    "MExt_TotalDuration",<br>    "MExt_VideoDuration",<br>    "MExt_AudioDuration",<br>    "MExt_VARDisplay",<br>    "MExt_VARRaw",<br>    "MExt_VideoCount",<br>    "MExt_AudioCount",<br>    "MExt_TextCount",<br>    "MExt_OthersCount",<br>    "MExt_VEncLibName",<br>    "MExt_VEncLib",<br>    "MExt_VCodecID",<br>    "MExt_ACodecID",<br>    "MExt_AFormatVersion",<br>    "MExt_AProfile",<br>    "MExt_EncoderApp",<br>    "MExt_DateEncoded",<br>    "MExt_DateTagged",<br>] | |
| TOGGLEABLE_FIELDS_OPTIONAL_AFTER  | string | MExt_SubtitleLang | |
| TOGGLEABLE_FIELDS_OTHER           | string[] (as json)         | [<br>    "MExt_HelperContainer",<br>    "MExt_HelperVideoCodec",<br>    "MExt_HelperAudioCodec",<br>    "MExt_CleanedUpName",<br>] | |
| TOGGLEABLE_FIELDS_OTHER_AFTER     | string | <none> | |
| TOGGLEABLE_FIELDS_VERBOSE         | string[] (as json) | [<br>    "MExt_ADSDataFormatted",<br>    "MExt_ADSDataRaw",<br>] | |
| TOGGLEABLE_FIELDS_VERBOSE_AFTER   | string | <none> | |
| CODEC_USE_SHORT_VARIANT           | boolean | false | |
| CODEC_APPEND_ADDINFO              | boolean | true | |
| RESOLUTION_APPEND_VERTICAL        | boolean | true | |
| FORMATS_REGEX_VBR                 | regexp (as string) | /ALAC\|Monkey's Audio\|TAK\|DSD/ | |
| FORMATS_REGEX_LOSSLESS            | regexp (as string) | /ALAC\|PCM\|TTA\|DSD/ | |
| FORMATS_REGEX_LOSSY               | regexp (as string) | /AMR/ | |
| LOOKUP_RESOLUTIONS                | <string, string> (as json) | {<br>    "240":      "240p",<br>    "360":      "360p",<br>    "480":      "480p",<br>    "576":      "576p",<br>    "720":      "720p",<br>    "1080":     "1080p",<br>    "2160":     "2160p",<br>    "4320":     "4320p"<br>} | |
| LOOKUP_DURATION_GROUPS            | <string, string> (as json) | {<br>    "0":        " ≠00:00",<br>    "60":       "< 01:00",<br>    "120":      "01:00-02:00",<br>    "180":      "02:00-03:00",<br>    "240":      "03:00-04:00",<br>    "300":      "04:00-05:00",<br>    "600":      "05:00-10:00",<br>    "900":      "10:00-15:00",<br>    "1200":     "15:00-20:00",<br>    "1800":     "20:00-30:00",<br>    "3600":     "30:00-1:00:00",<br>    "5400":     "Over 1h",<br>    "7200":     "Over 1.5h",<br>    "10800":    "Over 2h",<br>    "999999":   "Over 3h"<br>}`; | The comparison is always <= (less or equal), i.e.<br />*real duration <= config values*<br/><br />Some raw files extracted from movie containers, notably raw AAC (not M4A), raw DTS, raw Atmos are reported as having a 0 duration by MediaInfo. But if the file definitely has audio, you can recognize this as well.<br /><br/> \u2260 is the Unicode 'not equal' sign.<br/> <br />If the file has no audio track at all, this is grouped automatically under 'No Audio', no need to define it here.<br/><br />Also note that some values like 'Over 1h' depend on preceeding key's value |
| LOOKUP_CODECS                     | <string, string> (as json) | <see below> | |
| LOOKUP_CHANNELS                   | <string, string> (as json) | {<br>    "0": " ",<br>    "X": "≠0",<br>    "1": "1.0",<br>    "2": "2.0",<br>    "3": "2.1",<br>    "4": "4.0",<br>    "5": "5.0",<br>    "6": "5.1",<br>    "7": "5.2",<br>    "8": "7.1",<br>    "9": "7.2"<br>}`; | 0 means file has no audio track<br />X: means file has an audio track, but its channel information cannot be extracted by MediaInfo. Some formats like Musepack, raw DTS report an audio track but not the channel count, sorted between 0 & 1.<br/><br />Some alternatives for 0:<br />* "0": "0 (no audio)"<br/>* "0": "0 (n/a)"<br/>* "0": "0"<br/>If you use "0": "" the value 0 will be shown as empty string as well, which impacts sorting.<br /><br />Some alternatives for X:<br />* "X": "> 0",<br />* "X": "≠ 0" |
| NAME_CLEANUP           |  |  | Currently only for internal use. |
