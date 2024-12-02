// @ts-check
/* eslint quotes: ['error', 'single'] */
/* eslint-disable no-inner-declarations */
/* global ActiveXObject Enumerator DOpus Script */
/* eslint indent: [2, 4, {"SwitchCase": 1}] */
///<reference path='./std/libStdDev.ts' />
///<reference path='./libs/formatters.ts' />
///<reference path='./libs/libConfigAccess.ts' />
///<reference path='./libs/libLogger.ts' />
///<reference path='./libs/libCache.ts' />
///<reference path='./libs/libDOpusHelper.ts' />
///<reference path='./libs/libURLHelpers.ts' />
///<reference path='./libs/libFS.ts' />
///<reference path='./libs/libADS.ts' />

// use CTRL-SHIFT-B to build - you must have npx.cmd in your path

// DOpus.output('<b>Script parsing started</b>');



interface ScriptMeta extends g.ScriptMetaKnown {
    NAME_SHORT?             : string,
    DATE?                   : string,
    PREFIX?                 : string,
    LICENSE?                : string,
    CUSTCOL_MAP_NAME        : string,
    CUSTCOL_NAME_PREFIX?    : string,
    CUSTCOL_LABEL_PREFIX?   : string,
}
const scriptMeta: ScriptMeta = {
    NAME                    : 'CuMediaExtenders',
    NAME_SHORT              : 'MExt',
    VERSION                 : '1.0.0',
    COPYRIGHT               : '© 2021 cuneytyilmaz.com',
    URL                     : 'https://github.com/cy-gh/DOpus_CuMediaExtenders/',
    DESC                    : 'Extended fields for multimedia files (movie & audio) with the help of MediaInfo & NTFS ADS\nSee Help for more info.',
    MIN_VERSION             : '12.24.1',
    DATE                    : '20210724',
    GROUP                   : 'cuneytyilmaz.com',
    PREFIX                  : 'MExt', // prefix for field checks, log outputs, progress windows, etc. - do not touch
    LICENSE                 : 'Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
    CUSTCOL_MAP_NAME        : 'colExtraMap',
    CUSTCOL_NAME_PREFIX     : 'MExt_',
    CUSTCOL_LABEL_PREFIX    : 'ME ',
}
// TODO - REMOVE - temporary vars
scriptMeta.NAME = 'cuMovieTagger';
scriptMeta.NAME = 'DOpus_MovieTagger';
scriptMeta.NAME_SHORT = 'DMT';

/** allowed keys in user configuration via UI */
enum CfgU {
    DEBUG_LEVEL                         = 'DEBUG_LEVEL',
    FORCE_REFRESH_AFTER_UPDATE          = 'FORCE_REFRESH_AFTER_UPDATE',
    MEDIAINFO_PATH                      = 'MEDIAINFO_PATH',
    TEMP_FILES_DIR                      = 'TEMP_FILES_DIR',
    TEMPLESS_MODE                       = 'TEMPLESS_MODE',
    TEMPLESS_CHUNK_SIZE                 = 'TEMPLESS_CHUNK_SIZE',
    KEEP_ORIG_MODTS                     = 'KEEP_ORIG_MODTS',
    CACHE_ENABLED                       = 'CACHE_ENABLED',

    TOGGLEABLE_FIELDS_ESSENTIAL         = 'TOGGLEABLE_FIELDS_ESSENTIAL',
    TOGGLEABLE_FIELDS_ESSENTIAL_AFTER   = 'TOGGLEABLE_FIELDS_ESSENTIAL_AFTER',
    TOGGLEABLE_FIELDS_OPTIONAL          = 'TOGGLEABLE_FIELDS_OPTIONAL',
    TOGGLEABLE_FIELDS_OPTIONAL_AFTER    = 'TOGGLEABLE_FIELDS_OPTIONAL_AFTER',
    TOGGLEABLE_FIELDS_OTHER             = 'TOGGLEABLE_FIELDS_OTHER',
    TOGGLEABLE_FIELDS_OTHER_AFTER       = 'TOGGLEABLE_FIELDS_OTHER_AFTER',
    TOGGLEABLE_FIELDS_VERBOSE           = 'TOGGLEABLE_FIELDS_VERBOSE',
    TOGGLEABLE_FIELDS_VERBOSE_AFTER     = 'TOGGLEABLE_FIELDS_VERBOSE_AFTER',

    CODEC_USE_SHORT_VARIANT             = 'CODEC_USE_SHORT_VARIANT',
    CODEC_APPEND_ADDINFO                = 'CODEC_APPEND_ADDINFO',
    RESOLUTION_APPEND_VERTICAL          = 'RESOLUTION_APPEND_VERTICAL',
    LOOKUP_RESOLUTIONS                  = 'LOOKUP_RESOLUTIONS',
    LOOKUP_DURATION_GROUPS              = 'LOOKUP_DURATION_GROUPS',
    LOOKUP_CODECS                       = 'LOOKUP_CODECS',
    LOOKUP_CHANNELS                     = 'LOOKUP_CHANNELS',

    FORMATS_REGEX_VBR                   = 'FORMATS_REGEX_VBR',
    FORMATS_REGEX_LOSSLESS              = 'FORMATS_REGEX_LOSSLESS',
    FORMATS_REGEX_LOSSY                 = 'FORMATS_REGEX_LOSSY',

    REF_ALL_AVAILABLE_FIELDS            = 'REF_ALL_AVAILABLE_FIELDS',
    REF_LOOKUP_RESOLUTIONS              = 'REF_LOOKUP_RESOLUTIONS',
    REF_LOOKUP_DURATION_GROUPS          = 'REF_LOOKUP_DURATION_GROUPS',
    REF_LOOKUP_CODECS                   = 'REF_LOOKUP_CODECS',
    REF_LOOKUP_CHANNELS                 = 'REF_LOOKUP_CHANNELS',
    REF_CONFIG_FILE                     = 'REF_CONFIG_FILE',
    REF_NAME_CLEANUP                    = 'REF_NAME_CLEANUP',


    META_STREAM_NAME                    = 'META_STREAM_NAME',
    NAME_CLEANUP                        = 'NAME_CLEANUP',
}
/** allowed keys in external config */
enum CfgE {
    EXT_CONFIG_POJO                     = 'EXT_CONFIG_POJO',
}


const CfgVGroups: { [key in keyof typeof CfgU]: string } = {
    DEBUG_LEVEL                         : 'Listers',
    FORCE_REFRESH_AFTER_UPDATE          : 'Listers',
    MEDIAINFO_PATH                      : 'Paths',
    TEMP_FILES_DIR                      : 'Paths',
    TEMPLESS_MODE                       : 'Paths',
    TEMPLESS_CHUNK_SIZE                 : 'Paths',
    KEEP_ORIG_MODTS                     : 'System',
    CACHE_ENABLED                       : 'System',

    TOGGLEABLE_FIELDS_ESSENTIAL         : 'Toggleable Columns',
    TOGGLEABLE_FIELDS_ESSENTIAL_AFTER   : 'Toggleable Columns',
    TOGGLEABLE_FIELDS_OPTIONAL          : 'Toggleable Columns',
    TOGGLEABLE_FIELDS_OPTIONAL_AFTER    : 'Toggleable Columns',
    TOGGLEABLE_FIELDS_OTHER             : 'Toggleable Columns',
    TOGGLEABLE_FIELDS_OTHER_AFTER       : 'Toggleable Columns',
    TOGGLEABLE_FIELDS_VERBOSE           : 'Toggleable Columns',
    TOGGLEABLE_FIELDS_VERBOSE_AFTER     : 'Toggleable Columns',

    CODEC_USE_SHORT_VARIANT             : 'Formatting',
    CODEC_APPEND_ADDINFO                : 'Formatting',
    RESOLUTION_APPEND_VERTICAL          : 'Formatting',
    LOOKUP_RESOLUTIONS                  : 'Formatting',
    LOOKUP_DURATION_GROUPS              : 'Formatting',
    LOOKUP_CODECS                       : 'Formatting',
    LOOKUP_CHANNELS                     : 'Formatting',

    FORMATS_REGEX_VBR                   : 'Formatting / ADS Update Necessary',
    FORMATS_REGEX_LOSSLESS              : 'Formatting / ADS Update Necessary',
    FORMATS_REGEX_LOSSY                 : 'Formatting / ADS Update Necessary',

    REF_ALL_AVAILABLE_FIELDS            : 'zReference Only - Changes ignored',
    REF_LOOKUP_RESOLUTIONS              : 'zReference Only - Changes ignored',
    REF_LOOKUP_DURATION_GROUPS          : 'zReference Only - Changes ignored',
    REF_LOOKUP_CODECS                   : 'zReference Only - Changes ignored',
    REF_LOOKUP_CHANNELS                 : 'zReference Only - Changes ignored',
    REF_CONFIG_FILE                     : 'zReference Only - Changes ignored',
    REF_NAME_CLEANUP                    : 'zReference Only - Changes ignored',

    META_STREAM_NAME                    : 'zzDO NOT CHANGE UNLESS NECESSARY',
    NAME_CLEANUP                        : 'zReserved',
}

const CfgVDescs: { [key in keyof typeof CfgU]: string } = {
    DEBUG_LEVEL                         : 'Level of output messages in the Script Log (aka Output Log) shown by the script.\nLevels INFO & VERBOSE might slow down/freeze your DOpus',
    FORCE_REFRESH_AFTER_UPDATE          : 'Force refresh lister after updating metadata (retains current selection)',
    MEDIAINFO_PATH                      : 'Path to MediaInfo.exe; folder aliases and %envvar% are auto-resolved\nportable/CLI version can be downloaded from https://mediaarea.net/en/MediaInfo/Download/Windows',
    TEMP_FILES_DIR                      : 'Temp dir for MediaInfo output files, folder aliases and %envvar% are auto-resolved\nTemp files are immediately deleted after a file has been processed',
    TEMPLESS_MODE                       : 'EXPERIMENTAL: Get the MediaInfo output without using temporary files.\nUse at your own risk, might not work!',
    TEMPLESS_CHUNK_SIZE                 : 'EXPERIMENTAL: Reading chunk size in Templess Mode\nIf it works, increase further, if not decrease.',
    KEEP_ORIG_MODTS                     : 'Keep the original "last modified timestamp" after updating/deleting ADS data\nMust be TRUE if you use \'Dirty/Needs Update\' column',
    CACHE_ENABLED                       : 'Enable in-memory cache\nRead help for more info',

    TOGGLEABLE_FIELDS_ESSENTIAL         : 'Essential Fields (sorted) - used exclusively by supplied action Toggle Essential, otherwise no impact on functionality\nYou can use DOpus fields as well, e.g. FOURCC, mp3songlength...',
    TOGGLEABLE_FIELDS_ESSENTIAL_AFTER   : 'Put essential fields after this column; if invalid/invisible then columns are added at the end',
    TOGGLEABLE_FIELDS_OPTIONAL          : 'Optional fields (sorted) - used exclusively by supplied action Toggle Optional, otherwise no impact on functionality\nYou can use DOpus fields as well, e.g. FOURCC, mp3songlength...',
    TOGGLEABLE_FIELDS_OPTIONAL_AFTER    : 'Put optional fields after this column; if invalid/invisible then columns are added at the end',
    TOGGLEABLE_FIELDS_OTHER             : 'Other fields (sorted) - used exclusively by supplied action Toggle Optional, otherwise no impact on functionality\nYou can use DOpus fields as well, e.g. FOURCC, mp3songlength...',
    TOGGLEABLE_FIELDS_OTHER_AFTER       : 'Put other fields after this column; if invalid/invisible then columns are added at the end',
    TOGGLEABLE_FIELDS_VERBOSE           : 'Verbose fields (sorted) - used exclusively by supplied action Toggle Optional, otherwise no impact on functionality\nYou can use DOpus fields as well, e.g. FOURCC, mp3songlength...',
    TOGGLEABLE_FIELDS_VERBOSE_AFTER     : 'Put verbose fields after this column; if invalid/invisible then columns are added at the end',

    CODEC_USE_SHORT_VARIANT             : 'Use shorter version of codecs, e.g. APE instead of Monkey\'s Audio or MP3 instead of MP3 (v2)',
    CODEC_APPEND_ADDINFO                : 'Append \'additional codec info\' after main codec info, e.g. AAC, DTS will be displayed as AAC (LC), DTS (XLL) etc.\nTo change the main codec info (e.g. MP3 (v1)--> MP3), try CODEC_USE_SHORT_VARIANT=TRUE first, only then LOOKUP_CODECS',
    RESOLUTION_APPEND_VERTICAL          : 'Append (Vertical) to resolutions if height > width',
    LOOKUP_RESOLUTIONS                  : 'Resolution lookup hash (JSON), use SD, HD-Ready, HD, UHD, 4K, 8K, etc. if you like\nMust be valid JSON. See help for reference.',
    LOOKUP_DURATION_GROUPS              : 'Durations lookup hash (JSON) - only for group columns, leave empty for normal value or use too short, too long, etc.; always sorted alphabetically\nMust be valid JSON. See help for reference.',
    LOOKUP_CODECS                       : 'Codecs lookup hash (JSON) - SEE SOURCE CODE for more info\nMust be valid JSON. See help for reference.',
    LOOKUP_CHANNELS                     : 'Channel count lookup hash (JSON)\nMust be valid JSON. See help for reference.',

    FORMATS_REGEX_VBR                   : 'Formats which do not report a VBR flag but are by definition VBR\nWARNING: Stored in ADS, i.e. if you change this, UPDATE is necessary, lister refresh will not suffice',
    FORMATS_REGEX_LOSSLESS              : 'Formats which do not report a Lossless flag but are by definition Lossless\nWARNING: Stored in ADS, i.e. if you change this, UPDATE is necessary, lister refresh will not suffice',
    FORMATS_REGEX_LOSSY                 : 'Formats which do not report a Lossy flag but are by definition Lossy\nWARNING: Stored in ADS, i.e. if you change this, UPDATE is necessary, lister refresh will not suffice',

    REF_ALL_AVAILABLE_FIELDS            : 'For reference only - Changes ignored.\nList of all available columns; this list is used internally to calculate script defaults, change the TOGGLEABLE FIELDS options instead',
    REF_LOOKUP_RESOLUTIONS              : 'For reference only - Changes ignored.\nResolution lookup hash help',
    REF_LOOKUP_DURATION_GROUPS          : 'For reference only - Changes ignored.\nDurations lookup hash help',
    REF_LOOKUP_CODECS                   : 'For reference only - Changes ignored.\nCodecs lookup hash help',
    REF_LOOKUP_CHANNELS                 : 'For reference only - Changes ignored.\nChannel count lookup hash help',
    REF_CONFIG_FILE                     : 'For reference only - Changes ignored.\nExternal config file to customize column headers',
    REF_NAME_CLEANUP                    : 'For reference only - Changes ignored.\nName cleanup regexes help\nInternal use only at the moment.',

    META_STREAM_NAME                    : 'Name of NTFS stream (ADS) to use\nWARNING: DELETE existing ADS from all files before you change this, otherwise old streams will be orphaned',
    NAME_CLEANUP                        : 'Internal use only',
}

/** allowed fields in command definitions below */
type CommandTemplate = {
    // name: string,
    func  : Function,
    tmpl  : string,
    icon  : string,
    label : string,
    desc  : string,
    hide? : boolean
}
/** command definitions */
const AllCommands: { [_: string]: CommandTemplate } = {
    /*
        Available icon names, used by GetIcon()
            Calculate
            ClearCache
            Add
            Remove
            Delete
            Info
            Settings
            Toggle_Off
            Toggle_On
            Update
    */
    'CustomCommand': {
        func: CustomCommand,
        tmpl: 'FILE/S',
        icon: '8ball',
        label: 'Custom Command',
        desc: ''
    },

    'ME_Update': {
        func: OnME_Update,
        tmpl: 'FILE/K',
        icon: 'AddUpdate',
        label: 'MExt Update Metadata',
        desc: 'Update video and audio metadata (read by MediaInfo) in custom ADS stream'
    },

    'ME_Delete': {
        func: OnME_Delete,
        tmpl: 'FILE/K',
        icon: 'Delete',
        label: 'MExt Delete Metadata',
        desc: 'Delete video and audio metadata from custom ADS stream'
    },

    'ME_ClearCache': {
        func: OnME_ClearCache,
        tmpl: '',
        icon: 'ClearCache',
        label: 'MExt Clear Cache',
        desc: 'Clear the in-memory cache'
    },

    'ME_ADSDump': {
        func: OnME_ADSDump,
        tmpl: 'FILE/K',
        icon: 'Info',
        label: 'MExt Dump Metadata',
        desc: 'Dump video and audio metadata stored in ADS to DOpus output window'
    },

    'ME_ADSCopy': {
        func: OnME_ADSCopy,
        tmpl: 'FILE/K',
        icon: 'Info',
        label: 'MExt Copy Metadata',
        desc: 'Copy video and audio metadata stored in ADS to clipboard'
    },

    'ME_MediaInfoDump': {
        func: OnME_MediaInfoDump,
        tmpl: 'FILE/K',
        icon: 'Info',
        label: 'MExt Dump MediaInfo',
        desc: 'Dump video and audio metadata (read by MediaInfo) to DOpus output window, without writing it to the ADS stream'
    },

    'ME_MediaInfoCopy': {
        func: OnME_MediaInfoCopy,
        tmpl: 'FILE/K',
        icon: 'Info',
        label: 'MExt Copy MediaInfo',
        desc: 'Copy video and audio metadata (read by MediaInfo) to Clipboard, without writing it to the ADS stream'
    },

    'ME_EstimateBitrates': {
        func: OnME_EstimateBitrates,
        tmpl: 'FILE/K',
        icon: 'Calculate',
        label: 'MExt Estimate Bitrate',
        desc: 'Calculate estimated bitrates for various target Bitrate/Pixel values'
    },

    'ME_ToggleEssentialColumns': {
        func: OnME_ToggleEssentialColumns,
        tmpl: '',
        icon: 'ToggleGroup1',
        label: 'MExt Toggle Essential',
        desc: 'Toggle essential columns only'
    },

    'ME_ToggleOptionalColumns': {
        func: OnME_ToggleOptionalColumns,
        tmpl: '',
        icon: 'ToggleGroup2',
        label: 'MExt Toggle Optional',
        desc: 'Toggle optional columns'
    },

    'ME_ToggleOtherColumns': {
        func: OnME_ToggleOtherColumns,
        tmpl: '',
        icon: 'ToggleGroup3',
        label: 'MExt Toggle Other',
        desc: 'Toggle other columns'
    },

    'ME_ToggleVerboseColumns': {
        func: OnME_ToggleVerboseColumns,
        tmpl: '',
        icon: 'ToggleGroup4',
        label: 'MExt Toggle Verbose',
        desc: 'Toggle verbose columns'
    },

    'ME_ConfigValidate': {
        func: OnME_ConfigValidate,
        tmpl: 'DEBUG/S,SHOWVALUES/S',
        icon: 'Settings',
        label: 'MExt Validate Config',
        desc: 'Validate current configuration'
    },

    'ME_ShowHelp': {
        func: OnME_ShowHelp,
        tmpl: '',
        icon: 'Info',
        label: 'Help',
        desc: 'Show Help'
    },


    'ME_TestMethod1': {
        func: OnME_TestMethod1,
        tmpl: '',
        icon: 'Settings',
        label: 'MExt Test Method 1',
        desc: 'Test Method 1',
        hide: true
    },

    'ME_TestMethod2': {
        func: OnME_TestMethod2,
        tmpl: '',
        icon: 'Settings',
        label: 'MExt Test Method 2',
        desc: 'Test Method 2',
        hide: true
    },

}

/** allowed values for column justify */
enum ColumnJustify {
    Left  = 'left',
    Right = 'right'
}
/** allowed fields in column definitions below */
type ColumnTemplate = {
    // name: string,
    func       : Function,
    label      : string,
    justify    : ColumnJustify,
    autoGroup  : boolean,
    autoRefresh: boolean,
    multiCol   : boolean
}
/** column definitions */
const AllColumns: { [_: string]: ColumnTemplate } = {
    'MExt_HasMetadata': {
        func: OnMExt_HasMetadata,
        label: 'Available',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: false
    },
    'MExt_NeedsUpdate': {
        func: OnMExt_MultiColRead,
        label: 'Dirty',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VideoCount': {
        func: OnMExt_MultiColRead,
        label: 'VCount',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_AudioCount': {
        func: OnMExt_MultiColRead,
        label: 'ACount',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_TextCount': {
        func: OnMExt_MultiColRead,
        label: 'TCount',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_OthersCount': {
        func: OnMExt_MultiColRead,
        label: 'OCount',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VideoCodec': {
        func: OnMExt_MultiColRead,
        label: 'VCodec',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VideoBitrate': {
        func: OnMExt_MultiColRead,
        label: 'VBitrate',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_TotalBitrate': {
        func: OnMExt_MultiColRead,
        label: 'TBitrate',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_AudioCodec': {
        func: OnMExt_MultiColRead,
        label: 'ACodec',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_AudioBitrate': {
        func: OnMExt_MultiColRead,
        label: 'ABitrate',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_TotalDuration': {
        func: OnMExt_MultiColRead,
        label: 'TDuration',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VideoDuration': {
        func: OnMExt_MultiColRead,
        label: 'VDuration',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_AudioDuration': {
        func: OnMExt_MultiColRead,
        label: 'ADuration',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_CombinedDuration': {
        func: OnMExt_MultiColRead,
        label: 'Duration (Combined)',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_MultiAudio': {
        func: OnMExt_MultiColRead,
        label: 'Multi-Audio',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_AudioChannels': {
        func: OnMExt_MultiColRead,
        label: 'Audio Channels',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_AudioLang': {
        func: OnMExt_MultiColRead,
        label: 'Audio Language',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VARDisplay': {
        func: OnMExt_MultiColRead,
        label: 'Aspect Ratio (Display)',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VARRaw': {
        func: OnMExt_MultiColRead,
        label: 'Aspect Ratio (Raw)',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VARCombined': {
        func: OnMExt_MultiColRead,
        label: 'Aspect Ratio (Combined)',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    // justified to right, it is basically a number-based field, left as DOpus uses, does not make sense to me
    'MExt_VDimensions': {
        func: OnMExt_MultiColRead,
        label: 'Dimensions',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    // justified to right, it is basically a number-based field, left as DOpus uses, does not make sense to me
    'MExt_VResolution': {
        func: OnMExt_MultiColRead,
        label: 'Resolution',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VFrameRate': {
        func: OnMExt_MultiColRead,
        label: 'Frame Rate',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VFrameCount': {
        func: OnMExt_MultiColRead,
        label: 'Frame Count',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_AudioBitrateMode': {
        func: OnMExt_MultiColRead,
        label: 'ABitrate Mode',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_AudioCompressionMode': {
        func: OnMExt_MultiColRead,
        label: 'Audio Compression Mode',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_HasReplayGain': {
        func: OnMExt_MultiColRead,
        label: 'RG',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_SubtitleLang': {
        func: OnMExt_MultiColRead,
        label: 'Subtitle Lang',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_GrossByterate': {
        func: OnMExt_MultiColRead,
        label: 'Gross KBps',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VBitratePerPixel': {
        func: OnMExt_MultiColRead,
        label: 'VBitrate/Pixel',
        justify: ColumnJustify.Right,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VEncLib': {
        func: OnMExt_MultiColRead,
        label: 'Encoded Library',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VEncLibName': {
        func: OnMExt_MultiColRead,
        label: 'Encoded Library Name',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_VCodecID': {
        func: OnMExt_MultiColRead,
        label: 'Video Codec ID',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_ACodecID': {
        func: OnMExt_MultiColRead,
        label: 'Audio Codec ID',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_AFormatVersion': {
        func: OnMExt_MultiColRead,
        label: 'Audio Format Version',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_AProfile': {
        func: OnMExt_MultiColRead,
        label: 'Audio Format Profile',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_EncoderApp': {
        func: OnMExt_MultiColRead,
        label: 'Container Encoder App',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_DateEncoded': {
        func: OnMExt_MultiColRead,
        label: 'Container Encoded Date',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_DateTagged': {
        func: OnMExt_MultiColRead,
        label: 'Container Tagged Date',
        justify: ColumnJustify.Left,
        autoGroup: false,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_HelperContainer': {
        func: OnMExt_MultiColRead,
        label: 'Helper (Container)',
        justify: ColumnJustify.Left,
        autoGroup: true,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_HelperVideoCodec': {
        func: OnMExt_MultiColRead,
        label: 'Helper (VCodec)',
        justify: ColumnJustify.Left,
        autoGroup: true,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_HelperAudioCodec': {
        func: OnMExt_MultiColRead,
        label: 'Helper (ACodec)',
        justify: ColumnJustify.Left,
        autoGroup: true,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_CleanedUpName': {
        func: OnMExt_MultiColRead,
        label: 'Helper (CleanName)',
        justify: ColumnJustify.Left,
        autoGroup: true,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_ADSDataFormatted': {
        func: OnMExt_MultiColRead,
        label: 'ADSData (Formatted)',
        justify: ColumnJustify.Left,
        autoGroup: true,
        autoRefresh: true,
        multiCol: true
    },
    'MExt_ADSDataRaw': {
        func: OnMExt_MultiColRead,
        label: 'ADSData (Raw)',
        justify: ColumnJustify.Left,
        autoGroup: true,
        autoRefresh: true,
        multiCol: true
    },
}

/** allowed fields user-customizable JSON file*/
type ExtConfigType = {
    colPrefix?      : string,
    colRepl?        : { [key: string]: string },
    colExtra?       : { [key: string]: string },
    colExtraVideo?  : { [key: string]: string },
    colExtraAudio?  : { [key: string]: string },
}





var logger: ILogger;
var usr: config.User;
var ext: config.ScriptExt;
var mem: cache.IMemCache;
var nil: cache.IMemCache;

/** ❗ Do not clear cache vars here, otherwise they will be called every time the script is invoked! */
function _reinitGlobalVars(initData?: DOpusScriptInitData) {
    logger = logger || libLogger.std;
    usr    = usr || config.User.getInstance(initData).setLogger(logger);
    ext    = ext || config.ScriptExt.getInstance(initData).setLogger(logger);
    mem    = mem || cache.MemCache.getInstance(initData).setLogger(logger);
    nil    = nil || cache.NullCache.getInstance().setLogger(logger);

    // configuration must have been finalized before continuing
    if (initData) return;
    usr.getValue(CfgU.DEBUG_LEVEL).match({
        ok: (dbgLevel: number) => logger.setLevel(dbgLevel),
        err: (ex: IException<ex>) => ex.show()
    });
} // _reinitGlobalVars


/* Set up default config values - ❗ Do not forget to call usr.finalize() */
function _initConfigDefaults(usr: config.User) {
    _initConfigDefaults.fname = 'setupConfigVars';

    /**
     * Name of the ADS stream, can be also used via "dir /:" or "type file:stream_name" commands
     *
     * WARNING:
     * Make sure you use a long-term name for this stream.
     * If you want to rename this after having processed some files,
     * you should REMOVE all existing streams first (by calling the Remove command) before processing any file
     * otherwise those streams will not be processed by this script and become orphans,
     * and an army of thousands ghosts will haunt you for the rest of your life, you wouldn't like that mess
     *
     */
    usr.addValue(CfgU.META_STREAM_NAME,
        config.TYPE.STRING,
        'MExt_MediaInfo',
        CfgVGroups[CfgU.META_STREAM_NAME],
        CfgVDescs[CfgU.META_STREAM_NAME]
    ).show();


    usr.addValue(CfgU.MEDIAINFO_PATH,
        config.TYPE.PATH,
        '/programfiles/MediaInfo/MediaInfo.exe',
        CfgVGroups[CfgU.MEDIAINFO_PATH],
        CfgVDescs[CfgU.MEDIAINFO_PATH],
        false, // hide=false
        true // bypass=true - otherwise people will get an error on initial installation
    ).show();


    var _vDebugLevels = DOpus.create().vector();
    _vDebugLevels.push_back(logger.getLevelIndex().show().ok); // try to ignore Error in this case, we know logger is safe
    _vDebugLevels.append(logger.getLevels());
    usr.addValue(CfgU.DEBUG_LEVEL,
        config.TYPE.DROPDOWN,
        _vDebugLevels,
        CfgVGroups[CfgU.DEBUG_LEVEL],
        CfgVDescs[CfgU.DEBUG_LEVEL]
    ).show();


    /**
     * auto refresh lister after updating metadata
     *
     * please keep in mind, auto-refresh is not an automatic win
     * if you select a single in big folder, the whole folder must be refreshed,
     * i.e. all activated columns for all files need to be re-read
     * which might be slow depending on your config and longer than you might have intended
     *
     * however, also keep in mind the read time per size DOES NOT DEPEND ON THE FILE SIZE
     * the refresh time is relational to the NUMBER OF FILES and speed of your hdd/sdd/nvme/ramdisk/potato
     */
     usr.addValue(CfgU.FORCE_REFRESH_AFTER_UPDATE,
        config.TYPE.BOOLEAN,
        true,
        CfgVGroups[CfgU.FORCE_REFRESH_AFTER_UPDATE],
        CfgVDescs[CfgU.FORCE_REFRESH_AFTER_UPDATE]
    ).show();



    /** keep the original "last modified timestamp" after updating/deleting ADS; TRUE highly recommended */
    usr.addValue(CfgU.KEEP_ORIG_MODTS,
        config.TYPE.BOOLEAN,
        true,
        CfgVGroups[CfgU.KEEP_ORIG_MODTS],
        CfgVDescs[CfgU.KEEP_ORIG_MODTS]
    ).show();

    /**
     * cache metadata JS objects in memory for unchanged files to speed up process (the gain remains questionable IMO)
     *
     * the information stored in ADS is usually small, typically ~1 KB per file
     * the cache is used only and only if this script runs, i.e. automatically when any of the columns is visible (incl. in InfoTips/Tiles)
     * or if you trigger a command
     *
     * to ensure the information is always up-to-date, the following is used:
     *
     * - caching disabled or file is not in cache => read from disk
     * - file is already in cache => check file's last modification time against the timestamp in cached info
     *                                 if different => read from disk
     *                                 if same => use cache
     * - UPDATE command executed (regardless of file was in cache or not) => add to/update cache
     * - file is already in cache but DELETE command is executed => remove from cache
     *
     *
     * CAVEATS:
     * if you keep DOpus open for a long time and handle a lot of small files (only when any of these extra columns is shown),
     * the memory usage of DOpus will increase
     * this is not a 'memory leak' though, just the script doing what you tell it to: cache stuff :)
     *
     * to avoid high mem usage you can manually call the CLEARCACHE command via button, menu...
     */
    usr.addValue(CfgU.CACHE_ENABLED,
        config.TYPE.BOOLEAN,
        true,
        CfgVGroups[CfgU.CACHE_ENABLED],
        CfgVDescs[CfgU.CACHE_ENABLED]
    ).show();



    // get list of all columns with ^\s+col(?!\.name).+$\n in a decent editor
    var fields_base_reference, fields_essential = [], fields_optional = [], fields_verbose = [], fields_other = [];
    fields_base_reference = `
    {
        // This is just the help variable for your reference
        // (this is not valid JSON but makes it possible for me to show you more info)
        //
        // When you edit the real variable, just make sure it is valid JSON:
        // no single quotes, only double quotes, no comments and no trailing , in last element
        //
        // You can also use standard DOpus fields and mix it up with these fields
        // e.g. MExt_TotalDuration, mp3songlength, MExt_VResolution, picwidth, picheight...
        "MExt_HasMetadata"                : "essential",
        "MExt_NeedsUpdate"                : "essential",
        "MExt_TotalBitrate"               : "essential",
        "MExt_VideoCodec"                 : "essential",
        "MExt_VideoBitrate"               : "essential",
        "MExt_AudioCodec"                 : "essential",
        "MExt_AudioBitrate"               : "essential",
        "MExt_CombinedDuration"           : "essential",
        "MExt_VDimensions"                : "essential",
        "MExt_VResolution"                : "essential",
        "MExt_VFrameRate"                 : "essential",
        "MExt_VARCombined"                : "essential",
        "MExt_MultiAudio"                 : "essential",
        "MExt_AudioChannels"              : "essential",
        "MExt_AudioLang"                  : "essential",
        "MExt_AudioBitrateMode"           : "essential",
        "MExt_AudioCompressionMode"       : "essential",
        "MExt_HasReplayGain"              : "essential",
        "MExt_VBitratePerPixel"           : "essential",
        "MExt_SubtitleLang"               : "essential",

        "MExt_GrossByterate"              : "optional",
        "MExt_TotalDuration"              : "optional",
        "MExt_VideoDuration"              : "optional",
        "MExt_AudioDuration"              : "optional",
        "MExt_VARDisplay"                 : "optional",
        "MExt_VARRaw"                     : "optional",
        "MExt_VideoCount"                 : "optional",
        "MExt_AudioCount"                 : "optional",
        "MExt_TextCount"                  : "optional",
        "MExt_OthersCount"                : "optional",
        "MExt_VEncLibName"                : "optional",
        "MExt_VEncLib"                    : "optional",
        "MExt_VCodecID"                   : "optional",
        "MExt_ACodecID"                   : "optional",
        "MExt_AFormatVersion"             : "optional",
        "MExt_AProfile"                   : "optional",
        "MExt_EncoderApp"                 : "optional",
        "MExt_DateEncoded"                : "optional",
        "MExt_DateTagged"                 : "optional",

        "MExt_HelperContainer"            : "other",
        "MExt_HelperVideoCodec"           : "other",
        "MExt_HelperAudioCodec"           : "other",
        "MExt_CleanedUpName"              : "other",

        "MExt_ADSDataFormatted"           : "verbose",
        "MExt_ADSDataRaw"                 : "verbose"
    }`;
    usr.addValue(CfgU.REF_ALL_AVAILABLE_FIELDS,
        config.TYPE.STRING,
        fields_base_reference.normalizeLeadingWhiteSpace(),
        CfgVGroups[CfgU.REF_ALL_AVAILABLE_FIELDS]
    ).show();

    fields_base_reference = JSON.parse(fields_base_reference);
    for (var f in fields_base_reference) {
        switch(fields_base_reference[f]) {
            case 'essential': fields_essential.push(f); break;
            case 'optional':  fields_optional.push(f); break;
            case 'other':     fields_other.push(f); break;
            case 'verbose':   fields_verbose.push(f); break;
        }
    };

    usr.addValue(CfgU.TOGGLEABLE_FIELDS_ESSENTIAL,
        config.TYPE.ARRAY,
        fields_essential,
        CfgVGroups[CfgU.TOGGLEABLE_FIELDS_ESSENTIAL],
        CfgVDescs[CfgU.TOGGLEABLE_FIELDS_ESSENTIAL]
    ).show();
    usr.addValue(CfgU.TOGGLEABLE_FIELDS_OPTIONAL,
        config.TYPE.ARRAY,
        fields_optional,
        CfgVGroups[CfgU.TOGGLEABLE_FIELDS_OPTIONAL],
        CfgVDescs[CfgU.TOGGLEABLE_FIELDS_OPTIONAL]
    ).show();
    usr.addValue(CfgU.TOGGLEABLE_FIELDS_OTHER,
        config.TYPE.ARRAY,
        fields_other,
        CfgVGroups[CfgU.TOGGLEABLE_FIELDS_OTHER],
        CfgVDescs[CfgU.TOGGLEABLE_FIELDS_OTHER]
    ).show();
    usr.addValue(CfgU.TOGGLEABLE_FIELDS_VERBOSE,
        config.TYPE.ARRAY,
        fields_verbose,
        CfgVGroups[CfgU.TOGGLEABLE_FIELDS_VERBOSE],
        CfgVDescs[CfgU.TOGGLEABLE_FIELDS_VERBOSE]
    ).show();
    usr.addValue(CfgU.TOGGLEABLE_FIELDS_ESSENTIAL_AFTER,
        config.TYPE.STRING,
        'Comments',
        CfgVGroups[CfgU.TOGGLEABLE_FIELDS_ESSENTIAL_AFTER],
        CfgVDescs[CfgU.TOGGLEABLE_FIELDS_ESSENTIAL_AFTER]
    ).show();
    usr.addValue(CfgU.TOGGLEABLE_FIELDS_OPTIONAL_AFTER,
        config.TYPE.STRING,
        'MExt_SubtitleLang',
        CfgVGroups[CfgU.TOGGLEABLE_FIELDS_OPTIONAL_AFTER],
        CfgVDescs[CfgU.TOGGLEABLE_FIELDS_OPTIONAL_AFTER]
    ).show();
    usr.addValue(CfgU.TOGGLEABLE_FIELDS_OTHER_AFTER,
        config.TYPE.STRING,
        '',
        CfgVGroups[CfgU.TOGGLEABLE_FIELDS_OTHER_AFTER],
        CfgVDescs[CfgU.TOGGLEABLE_FIELDS_OTHER_AFTER]
    ).show();
    usr.addValue(CfgU.TOGGLEABLE_FIELDS_VERBOSE_AFTER,
        config.TYPE.STRING,
        '',
        CfgVGroups[CfgU.TOGGLEABLE_FIELDS_VERBOSE_AFTER],
        CfgVDescs[CfgU.TOGGLEABLE_FIELDS_VERBOSE_AFTER]
    ).show();


    /** video resolution translation hash, use SD, HD-Ready, HD, UHD, 4K, 8K, etc. if you like */
    var lookup_resolutions = `
    {
        // This is just the help variable for your reference
        // (this is not valid JSON but makes it possible for me to show you more info)
        //
        // When you edit the real variable, just make sure it is valid JSON:
        // no single quotes, only double quotes, no comments and no trailing , in last element
        //
        // the comparison is always <= (less or equal), i.e. real duration <= config values below
        "240":      "240p",
        "360":      "360p",
        "480":      "480p",
        "576":      "576p",
        "720":      "720p",
        "1080":     "1080p",
        "2160":     "2160p",
        "4320":     "4320p"

        // do not put , in the last line
    }`;
    usr.addValue(CfgU.LOOKUP_RESOLUTIONS,
        config.TYPE.POJO,
        JSON.parse(lookup_resolutions),
        CfgVGroups[CfgU.LOOKUP_RESOLUTIONS],
        CfgVDescs[CfgU.LOOKUP_RESOLUTIONS]
    ).show();


    var lookup_duration_groups = `
    {
        // This is just the help variable for your reference
        // (this is not valid JSON but makes it possible for me to show you more info)
        //
        // When you edit the real variable, just make sure it is valid JSON:
        // no single quotes, only double quotes, no comments and no trailing , in last element
        //
        // the comparison is always <= (less or equal), i.e. real duration <= config values below
        // if reported duration is 0 but the file definitely has audio e.g raw AAC/DTS/Atmos.., you can recognize this as well
        // \u2260 is the Unicode 'not equal' sign
        // if the file has no audio track at all, this is grouped automatically under 'No Audio', no need to define it here
        // Note that some values like 'Over 1h' depend on preceeding key's value
        "0":        " ≠00:00",
        "60":       "< 01:00",
        "120":      "01:00-02:00",
        "180":      "02:00-03:00",
        "240":      "03:00-04:00",
        "300":      "04:00-05:00",
        "600":      "05:00-10:00",
        "900":      "10:00-15:00",
        "1200":     "15:00-20:00",
        "1800":     "20:00-30:00",
        "3600":     "30:00-1:00:00",
        "5400":     "Over 1h",
        "7200":     "Over 1.5h",
        "10800":    "Over 2h",
        "999999":   "Over 3h"
        // do not put , in the last line
    }`;
    usr.addValue(CfgU.LOOKUP_DURATION_GROUPS,
        config.TYPE.POJO,
        JSON.parse(lookup_duration_groups),
        CfgVGroups[CfgU.LOOKUP_DURATION_GROUPS],
        CfgVDescs[CfgU.LOOKUP_DURATION_GROUPS]
    ).show();

    /**
     * video & audio codecs translation hash
     *
     * you might have to experiment a little bit to have the output suitable for your needs
     * I've tried to keep them as close to DOpus as possible, but concerning how wild the MPEG specs are
     * and how different encoders encode the videos, muxers set FourCC codes and other metainfo
     * you might not always see what you see in another program, e.g. AviDemux might show it as DIVX and another program as MP42, etc.
     */
    var lookup_codecs = `
    {
        // This is just the help variable for your reference
        // (this is not valid JSON but makes it possible for me to show you more info)
        //
        // When you edit the real variable, just make sure it is valid JSON:
        // no single quotes, only double quotes, no comments and no trailing , in last element
        //
        // If there is an array with 2 elements on the right
        // you can switch to 2nd "short" version via script config.
        //
        // All fields below are first upper-cased then probed
        //
        // video probed in following order - activate the Helper columns if necessary
        // #1. CONTAINER_FORMAT - VIDEO_FORMAT - VIDEO_CODEC - ENC_LIBNAME
        // #2. CONTAINER_FORMAT - VIDEO_FORMAT - VIDEO_CODEC
        // #3. CONTAINER_FORMAT - VIDEO_FORMAT - ENC_LIBNAME
        // #4. CONTAINER_FORMAT - VIDEO_FORMAT
        // #5. CONTAINER_FORMAT - VIDEO_CODEC
        // #6. VIDEO_FORMAT - VIDEO_CODEC - ENC_LIBNAME
        // #7. VIDEO_FORMAT - VIDEO_CODEC
        // #8. VIDEO_FORMAT - ENC_LIBNAME
        // #9. VIDEO_FORMAT
        // #A. VIDEO_CODEC
        //
        // the more specific items, i.e. items near the top, should be preferred
        // but should be non-specific enough in case they are embedded in a movie file
        // that is why you should prefer AAC-MP4A-40-2 or AAC to MKA-AAC-MP4A-40-2 or MP4-AAC-MP4A-40-2
        // otherwise you would have to re-declare the same codecs over and over for every movie container
        // use one of the helper columns if you find something which is not shown to your liking
        "AV1-AV01"                                               : "AV1",
        "AV1"                                                    : "AV1",
        "AVC-AVC1-X264"                                          : ["H264 (x264)", "H264"],
        "AVC-H264-X264"                                          : ["H264 (x264)", "H264"],
        "AVC-V_MPEG4/ISO/AVC-X264"                               : ["H264 (x264)", "H264"],
        "AVC-X264"                                               : ["H264 (x264)", "H264"],
        "AVC-AVC1"                                               : "H264",
        "AVC"                                                    : "H264",
        "HEVC-HVC1-X265"                                         : ["H265 (x265)", "H265"],
        "HEVC-V_MPEGH/ISO/HEVC-X265"                             : ["H265 (x265)", "H265"],
        "HEVC-X265"                                              : ["H265 (x265)", "H265"],
        "HEVC-HVC1"                                              : "H265",
        "HEVC"                                                   : "H265",

        "HUFFYUV-HFYU"                                           : ["HuffYUV", "HFYU"],
        "HUFFYUV-V_MS/VFW/FOURCC / HFYU"                         : ["HuffYUV", "HFYU"],
        "HUFFYUV"                                                : ["HuffYUV", "HFYU"],

        "MPEG-4 VISUAL-DIV3"                                     : "Div3",
        "MPEG-4 VISUAL-V_MPEG4/MS/V3"                            : "Div3",
        "MPEG-4 VISUAL-DIVX"                                     : "DivX",
        "MPEG-4 VISUAL-V_MPEG4/ISO/ASP"                          : "DivX",
        "MPEG-4 VISUAL-DX50"                                     : "DivX5",
        "MPEG-4 VISUAL-MP4V-20"                                  : ["M4S2/MP4V", "MP4V"],
        "MPEG-4 VISUAL-MP42"                                     : "MP42",
        "MPEG-4 VISUAL-V_MS/VFW/FOURCC / MP42"                   : "MP42",
        "MPEG-4 VISUAL-V_MS/VFW/FOURCC / XVID"                   : "XviD",
        "MPEG-4 VISUAL-V_MS/VFW/FOURCC / DIV3"                   : "DivX",
        "MPEG-4 VISUAL-V_MS/VFW/FOURCC / DIVX"                   : "DivX",
        "MPEG-4 VISUAL-V_MS/VFW/FOURCC / DX50"                   : "DivX5",
        "MPEG-4 VISUAL-MP43"                                     : "MP43",
        "MPEG-4 VISUAL-XVID"                                     : "XviD",
        // "MPEG-4 VISUAL-DIV3"                                     : "DivX",
        "XVID-XVID"                                              : "XviD",
        "XVID"                                                   : "XviD",
        "MPEG VIDEO-MP4V-6A"                                     : "MPG1",
        "MPEG VIDEO-V_MPEG1"                                     : "MPG1",
        "MPEG VIDEO"                                             : "MPEG",
        "SORENSON SPARK"                                         : "FLV1",
        "VP6-VP6F"                                               : "VP6",
        "VP6"                                                    : "VP6",
        "VP8-VP8F"                                               : "VP8",
        "VP8"                                                    : "VP8",
        "VP9-V_VP9"                                              : "VP9",
        "VP9"                                                    : "VP9",
        "H.263-S263"                                             : "H263",
        "H.263"                                                  : "H263",
        "VC-1-WMV3"                                              : ["WMV3 (VC1)", "WMV3"],
        "VC-1"                                                   : "WMV3",
        "V_QUICKTIME"                                            : "",

        // All fields below are first upper-cased then probed
        //
        // audio probed in following order - activate the Helper columns if necessary
        // #1. CONTAINER_FORMAT - AUDIO_FORMAT - AUDIO_CODEC - AUDIO_FORMAT_VERSION - AUDIO_FORMAT_PROFILE - AUDIO_SETTINGS_MODE
        // #2. CONTAINER_FORMAT - AUDIO_FORMAT - AUDIO_CODEC - AUDIO_FORMAT_VERSION - AUDIO_FORMAT_PROFILE
        // #3. CONTAINER_FORMAT - AUDIO_FORMAT - AUDIO_CODEC - AUDIO_FORMAT_VERSION
        // #4. CONTAINER_FORMAT - AUDIO_FORMAT - AUDIO_CODEC
        // #5. CONTAINER_FORMAT - AUDIO_FORMAT
        // #6. AUDIO_FORMAT - AUDIO_CODEC - AUDIO_FORMAT_VERSION - AUDIO_FORMAT_PROFILE - AUDIO_SETTINGS_MODE
        // #7. AUDIO_FORMAT - AUDIO_CODEC - AUDIO_FORMAT_VERSION - AUDIO_FORMAT_PROFILE
        // #8. AUDIO_FORMAT - AUDIO_CODEC - AUDIO_FORMAT_VERSION
        // #9. AUDIO_FORMAT - AUDIO_CODEC
        // #A. AUDIO_FORMAT
        // #B. AUDIO_CODEC
        // #C. AUDIO_FORMAT - AUDIO_FORMAT_PROFILE  (mainly for MP3)

        "WMA-161-2"                                              : ["WMA (v9.2)", "WMA"],
        "WMA-162--PRO"                                           : ["WMA (v10 Pro)", "WMA"],
        "WMA-163--LOSSLESS"                                      : ["WMA (v9.2 Lossless)", "WMA"],
        "WMA-A"                                                  : ["WMA (v9 Voice)", "WMA"],
        "WMA"                                                    : ["WMA", "WMA"],

        "AC-3-A_EAC3"                                            : ["AC3 (Dolby Digital Plus)", "EAC3"],
        "E-AC-3-A_EAC3"                                          : ["AC3 (Dolby Digital Plus)", "EAC3"],

        "AC-3----DOLBY DIGITAL"                                  : ["AC3 (Dolby Digital)", "AC3"],
        "AC-3"                                                   : "AC3",

        "AIFF-PCM"                                               : ["PCM (AIFF)", "PCM"],

        "AMR-AMR---NARROW BAND"                                  : ["AMR (Narrow Band)", "AMR"],
        "AMR-SAMR---NARROW BAND"                                 : ["AMR (Narrow Band)", "AMR"],
        "AMR"                                                    : "AMR",

        "MONKEY'S AUDIO"                                         : ["Monkey's Audio", "APE"],
        "DSD"                                                    : "DSD",
        "FLAC"                                                   : "FLAC",
        "DTS"                                                    : "DTS",

        "ADTS-AAC"                                               : ["AAC (Raw)", "AAC"],
        "AAC-MP4A-40-2"                                          : "AAC",
        "AAC"                                                    : "AAC",

        "ALAC-ALAC"                                              : ["ALAC (Apple Lossless)","ALAC"],
        "ALAC"                                                   : ["ALAC (Apple Lossless)","ALAC"],

        "MLP FBA"                                                : ["Dolby TrueHD", "TrueHD"],
        "MUSEPACK SV8"                                           : ["Musepack", "MPC"],

        // MPEG audio is major PITA like MPEG video!
        "MPEG AUDIO--1-LAYER 2"                                  : ["MP2 (v1)", "MP2"],
        "MPEG AUDIO--2-LAYER 2"                                  : ["MP2 (v2)", "MP2"],
        "MPEG AUDIO--2.5-LAYER 2"                                : ["MP2 (v2.5)", "MP2"],
        "MPEG AUDIO-50-1-LAYER 2"                                : ["MP2 (v1)", "MP2"],
        "MPEG AUDIO-50-2-LAYER 2"                                : ["MP2 (v2)", "MP2"],
        "MPEG AUDIO-50-2.5-LAYER 2"                              : ["MP2 (v2.5)", "MP2"],
        "MPEG AUDIO-55-1-LAYER 2"                                : ["MP2 (v1)", "MP2"],
        "MPEG AUDIO-55-2-LAYER 2"                                : ["MP2 (v2)", "MP2"],
        "MPEG AUDIO-55-2.5-LAYER 2"                              : ["MP2 (v2.5)", "MP2"],
        "MPEG AUDIO-MP4A-69-1-LAYER 2"                           : ["MP2 (v1)", "MP2"],
        "MPEG AUDIO-MP4A-69-2-LAYER 2"                           : ["MP2 (v2)", "MP2"],
        "MPEG AUDIO-MP4A-69-2.5-LAYER 2"                         : ["MP2 (v2.5)", "MP2"],
        "MPEG AUDIO-MP4A-6B-1-LAYER 2"                           : ["MP2 (v1)", "MP2"],
        "MPEG AUDIO-MP4A-6B-2-LAYER 2"                           : ["MP2 (v2)", "MP2"],
        "MPEG AUDIO-MP4A-6B-2.5-LAYER 2"                         : ["MP2 (v2.5)", "MP2"],
        "MPEG AUDIO-A_MPEG/L3-1-LAYER 2"                         : ["MP2 (v1)", "MP2"],
        "MPEG AUDIO-A_MPEG/L3-2-LAYER 2"                         : ["MP2 (v2)", "MP2"],
        "MPEG AUDIO-A_MPEG/L3-2.5-LAYER 2"                       : ["MP2 (v2.5)", "MP2"],
        "MPEG AUDIO--1-LAYER 3"                                  : ["MP3 (v1)", "MP3"],
        "MPEG AUDIO--2-LAYER 3"                                  : ["MP3 (v2)", "MP3"],
        "MPEG AUDIO--2.5-LAYER 3"                                : ["MP3 (v2.5)", "MP3"],
        "MPEG AUDIO-50-1-LAYER 3"                                : ["MP3 (v1)", "MP3"],
        "MPEG AUDIO-50-2-LAYER 3"                                : ["MP3 (v2)", "MP3"],
        "MPEG AUDIO-50-2.5-LAYER 3"                              : ["MP3 (v2.5)", "MP3"],
        "MPEG AUDIO-55-1-LAYER 3"                                : ["MP3 (v1)", "MP3"],
        "MPEG AUDIO-55-2-LAYER 3"                                : ["MP3 (v2)", "MP3"],
        "MPEG AUDIO-55-2.5-LAYER 3"                              : ["MP3 (v2.5)", "MP3"],
        "MPEG AUDIO-MP4A-69-1-LAYER 3"                           : ["MP3 (v1)", "MP3"],
        "MPEG AUDIO-MP4A-69-2-LAYER 3"                           : ["MP3 (v2)", "MP3"],
        "MPEG AUDIO-MP4A-69-2.5-LAYER 3"                         : ["MP3 (v2.5)", "MP3"],
        "MPEG AUDIO-MP4A-6B-1-LAYER 3"                           : ["MP3 (v1)", "MP3"],
        "MPEG AUDIO-MP4A-6B-2-LAYER 3"                           : ["MP3 (v2)", "MP3"],
        "MPEG AUDIO-MP4A-6B-2.5-LAYER 3"                         : ["MP3 (v2.5)", "MP3"],
        "MPEG AUDIO-A_MPEG/L3-1-LAYER 3"                         : ["MP3 (v1)", "MP3"],
        "MPEG AUDIO-A_MPEG/L3-2-LAYER 3"                         : ["MP3 (v2)", "MP3"],
        "MPEG AUDIO-A_MPEG/L3-2.5-LAYER 3"                       : ["MP3 (v2.5)", "MP3"],

        // mega fallback
        // if you do not want all the MP1/MP2/MP3 details, comment the block above, and these 3 will be used
        "MPEG AUDIO-LAYER 1"                                     : "MP1",
        "MPEG AUDIO-LAYER 2"                                     : "MP2",
        "MPEG AUDIO-LAYER 3"                                     : "MP3",

        // Alternative, Multi-Channel aware definitions
        // WAVE64-PCM-00000003-0000-0010-8000-00AA00389B71--FLOAT'  : 'PCM (Wave64, 32bit, MultiCh)
        // WAVE64-PCM-3--FLOAT'                                     : 'PCM (Wave64, 32bit, 2.0)
        // WAVE-PCM-00000003-0000-0010-8000-00AA00389B71--FLOAT'    : 'PCM (Wave, 32bit, MultiCh)
        // WAVE-PCM-3--FLOAT'                                       : 'PCM (Wave, 32bit, 2.0)
        // WAVE64-PCM-1'                                            : 'PCM (Wave64, 16/24bit, 2.0)
        // WAVE-PCM-1'                                              : 'PCM (Wave, 16/24bit, 2.0)
        // WAVE64-PCM-00000001-0000-0010-8000-00AA00389B71'         : 'PCM (Wave64, 16/24bit, MultiCh)
        // WAVE-PCM-00000001-0000-0010-8000-00AA00389B71'           : 'PCM (Wave, 16/24bit, MultiCh)

        "WAVE64-PCM-00000003-0000-0010-8000-00AA00389B71--FLOAT" : ["PCM (Wave64, 32bit)", "PCM"],
        "WAVE64-PCM-3--FLOAT"                                    : ["PCM (Wave64, 32bit)", "PCM"],
        "WAVE-PCM-00000003-0000-0010-8000-00AA00389B71--FLOAT"   : ["PCM (Wave, 32bit)", "PCM"],
        "WAVE-PCM-3--FLOAT"                                      : ["PCM (Wave, 32bit)", "PCM"],
        "WAVE64-PCM-1"                                           : ["PCM (Wave64, 16/24bit)", "PCM"],
        "WAVE-PCM-1"                                             : ["PCM (Wave, 16/24bit)", "PCM"],
        "WAVE64-PCM-00000001-0000-0010-8000-00AA00389B71"        : ["PCM (Wave64, 16/24bit)", "PCM"],
        "WAVE-PCM-00000001-0000-0010-8000-00AA00389B71"          : ["PCM (Wave, 16/24bit)", "PCM"],
        "WAVE64-PCM"                                             : ["PCM (Wave64)", "PCM"],
        "WAVE-PCM"                                               : ["PCM (Wave)", "PCM"],
        "WAVE64"                                                 : ["PCM (Wave64)", "PCM"],
        "WAVE"                                                   : ["PCM (Wave)", "PCM"],

        "PCM"                                                    : "PCM",

        "OGG-OPUS"                                               : "Opus",
        "OPUS"                                                   : "Opus",
        "TAK-TAK"                                                : ["Tom's Audio", "TAK"],
        "TAK"                                                    : ["Tom's Audio", "TAK"],
        "TTA-TTA"                                                : ["TTA (TrueAudio)", "TTA"],
        "TTA"                                                    : ["TTA (TrueAudio)", "TTA"],
        "OGG-VORBIS"                                             : "Vorbis",
        "VORBIS"                                                 : "Vorbis",
        "WAVPACK-WAVPACK"                                        : ["WavPack", "WV"],
        "WAVPACK"                                                : ["WavPack", "WV"]

        // do not put , in the last line
    }`;
    usr.addValue(CfgU.REF_LOOKUP_CODECS,
        config.TYPE.STRING,
        lookup_codecs.normalizeLeadingWhiteSpace(),
        CfgVGroups[CfgU.REF_LOOKUP_CODECS],
        CfgVDescs[CfgU.REF_LOOKUP_CODECS]
    ).show();
    usr.addValue(CfgU.LOOKUP_CODECS,
        config.TYPE.POJO,
        JSON.parse(lookup_codecs),
        CfgVGroups[CfgU.LOOKUP_CODECS],
        CfgVDescs[CfgU.LOOKUP_CODECS]
    ).show();

    /** use short variants of codecs, found via LOOKUP_CODECS */
    usr.addValue(CfgU.CODEC_USE_SHORT_VARIANT,
        config.TYPE.BOOLEAN,
        false,
        CfgVGroups[CfgU.CODEC_USE_SHORT_VARIANT],
        CfgVDescs[CfgU.CODEC_USE_SHORT_VARIANT]
    ).show();

    /**
     * add container or codec-specific information to the container/video/audio codec fields automatically
     * e.g. if an AAC file is encoded with 'LC SBR' it is shown as 'AAC (LC SPR)'
     */
    usr.addValue(CfgU.CODEC_APPEND_ADDINFO,
        config.TYPE.BOOLEAN,
        true,
        CfgVGroups[CfgU.CODEC_APPEND_ADDINFO],
        CfgVDescs[CfgU.CODEC_APPEND_ADDINFO]
    ).show();

    /** append custom string '(Vertical)' to vertical  video resolutions */
    usr.addValue(CfgU.RESOLUTION_APPEND_VERTICAL,
        config.TYPE.STRING,
        ' (Vertical)',
        CfgVGroups[CfgU.RESOLUTION_APPEND_VERTICAL],
        CfgVDescs[CfgU.RESOLUTION_APPEND_VERTICAL]
    ).show();

    /** Audio formats which do not store a VBR/CBR/ABR information separately but are VBR by definition */
    usr.addValue(CfgU.FORMATS_REGEX_VBR,
        config.TYPE.REGEXP,
        '/ALAC|Monkey\'s Audio|TAK|DSD/',
        CfgVGroups[CfgU.FORMATS_REGEX_VBR],
        CfgVDescs[CfgU.FORMATS_REGEX_VBR]
    ).show();

    /** Audio formats which do not store a lossy/lossless information separately but are lossless by definition */
    usr.addValue(CfgU.FORMATS_REGEX_LOSSLESS,
        config.TYPE.REGEXP,
        '/ALAC|PCM|TTA|DSD/',
        CfgVGroups[CfgU.FORMATS_REGEX_LOSSLESS],
        CfgVDescs[CfgU.FORMATS_REGEX_LOSSLESS]
    ).show();
    usr.addValue(CfgU.FORMATS_REGEX_LOSSY,
        config.TYPE.REGEXP,
        '/AMR/',
        CfgVGroups[CfgU.FORMATS_REGEX_LOSSY],
        CfgVDescs[CfgU.FORMATS_REGEX_LOSSY]
    ).show();

    /** audio channels translation hash */
    var lookup_channels = `
    {
        // This is just the help variable for your reference
        // (this is not valid JSON but makes it possible for me to show you more info)
        //
        // When you edit the real variable, just make sure it is valid JSON:
        // no single quotes, only double quotes, no comments and no trailing , in last element
        //
        // alternative 1: '0': '0 (no audio)'
        // alternative 2: '0': '0 (n/a)'
        // alternative 3: '0': '0'
        // if you use   '0': ''   the value 0 will be shown as empty string as well, which impacts sorting
        "0": " ",

        // "X": "> 0', // for formats like MusePack & raw DTS which report an audio track but not the channel count, sorted between 0 & 1",
        // "X": "≠ 0', // for formats like MusePack & raw DTS which report an audio track but not the channel count, sorted between 0 & 1",
        "X": "≠0",

        "1": "1.0",
        "2": "2.0",
        "3": "2.1",
        "4": "4.0",
        "5": "5.0",
        "6": "5.1",
        "7": "5.2",
        "8": "7.1",
        "9": "7.2"

        // do not put , in the last line
    }`;
    usr.addValue(CfgU.REF_LOOKUP_CHANNELS,
        config.TYPE.STRING,
        lookup_channels.normalizeLeadingWhiteSpace(),
        CfgVGroups[CfgU.REF_LOOKUP_CHANNELS],
        CfgVDescs[CfgU.REF_LOOKUP_CHANNELS]
    ).show();
    usr.addValue(CfgU.LOOKUP_CHANNELS,
        config.TYPE.POJO,
        JSON.parse(lookup_channels),
        CfgVGroups[CfgU.LOOKUP_CHANNELS],
        CfgVDescs[CfgU.LOOKUP_CHANNELS]
    ).show();


    /** directory in which temporary files (selected_files_name.JSON) are created */
    usr.addValue(CfgU.TEMP_FILES_DIR,
        config.TYPE.PATH,
        '%TEMP%',
        CfgVGroups[CfgU.TEMP_FILES_DIR],
        CfgVDescs[CfgU.TEMP_FILES_DIR]
    ).show();


    /** external configuration file to adjust column headers */
    var config_file_contents = `
    {
        // To customize the column headers
        // create a file with the name: ${scriptMeta.NAME}.json
        // under: /dopusdata/Script AddIns
        // (usually: ${g.SCRIPTSDIR})
        //
        // DOpus does not allow column headers to be changed during runtime
        // but only during initialization.
        // That is, if you change these you have to restart DOpus or disable & enable the script.
        //
        // This is just the help variable for your reference
        // (this is not valid JSON but makes it possible for me to show you more info)
        //
        // When you edit the real variable, just make sure it is valid JSON:
        // no single quotes, only double quotes, no comments and no trailing , in last element
        //
        // prefix for all columns, e.g.
        // colPrefix: "",
        // colPrefix: ".",
        "colPrefix": "ME ",

        // use any replacement for any column
        // if a name for a column cannot be found, script default will be used
        // note all internal column names start with: ${scriptMeta.PREFIX}
        //
        // replacement values must be valid JS string, i.e. quoted
        // e.g.
        "colRepl": {
            "MExt_CombinedDuration": "Duration",
            "MExt_GrossByterate": "Byterate",
            "MExt_MultiAudio": "Multiple Audio Tracks"
            // do not put , in the last line
        }
        // do not put , in the last line
    }`.substituteVars();
    usr.addValue(CfgU.REF_CONFIG_FILE,
        config.TYPE.STRING,
        config_file_contents.normalizeLeadingWhiteSpace(),
        CfgVGroups[CfgU.REF_CONFIG_FILE],
        CfgVDescs[CfgU.REF_CONFIG_FILE]
    ).show();


    /** name cleanup array; use SD, HD-Ready, HD, UHD, 4K, 8K, etc. if you like */
    var name_cleanup = `
    {
        // This is just the help variable for your reference
        // (this is not valid JSON but makes it possible for me to show you more info)
        //
        // When you edit the real variable, just make sure it is valid JSON:
        // no single quotes, only double quotes, no comments and no trailing , in last element
        //
        // nameOnly applies to the name part of the file and extOnly to the extension
        "nameOnly": [
            // video codecs
            ["/x264|x265|H264|H265|DX50|DivX5|DivX4|DivX|XviD|VP9|VP6F|FLV1|HEVC|MPEG4|MP4V|MP42/ig",      ""],
            // audio codecs
            ["/AAC|AC3|DTS|MP3|OGG/ig",                                                          ""],
            // resolutions
            ["/240p|320p|360p|480p|540p|640p|720p|960p|1080p|1440p|2160p|4K|UHD/ig",             ""],
            ["/(_|\.)/g",                                                                        " " ],
            ["/(\d+).+$/g",                                                                      "$1" ],
            // normalize whitespace after all the replacements above
            ["/\s+/g",                                                                           " " ],
            ["/-\s*-/g",                                                                         "-" ]
        ],
        "extOnly": [
        ]
        // do not put , in the last line
    }`;
    usr.addValue(CfgU.NAME_CLEANUP,
        config.TYPE.POJO,
        JSON.parse(name_cleanup),
        CfgVGroups[CfgU.NAME_CLEANUP],
        CfgVDescs[CfgU.NAME_CLEANUP]
    ).show();

    usr.finalize();

} // _initConfigDefaults


/** Set up script commands */
function _initCommands(initData: DOpusScriptInitData) {
    const fname = _initCommands.fname = '_initCommands';

    function _getIcon(iconName: string) {
        var oPath = g.getItem(initData.file);
        var isOSP = oPath.ext === 'osp';
        logger.normal('Requested icon: ' + iconName + ', is OSP: ' + isOSP + '  --  ' + initData.file);
        return isOSP
            ? '#MExt:' + iconName
            : oPath.path + "\\icons\\MExt\\MExt_32_" + iconName + ".png";
    }

    logger.snormal('%s -- started', fname);
    for (const commandName in AllCommands) {
        if (Object.prototype.hasOwnProperty.call(AllCommands, commandName)) {
            const commandParams = AllCommands[commandName];
            logger.snormal('%s -- adding command: %s, name: %s, function: %s', fname, commandName, (scriptMeta.NAME_SHORT ||'') + commandName, g.funcNameExtractor(commandParams.func));
            var cmd         = initData.addCommand();
            cmd.name        = (scriptMeta.NAME_SHORT ||'') + commandName;
            cmd.method      = g.funcNameExtractor(commandParams.func);
            cmd.template    = commandParams.tmpl || '';
            cmd.icon		= commandParams.icon && _getIcon(commandParams.icon) || '';
            cmd.label		= commandParams.label || '';
            cmd.desc        = commandParams.desc || commandParams.label;
            cmd.hide        = typeof commandParams.hide !== 'undefined' && commandParams.hide || false;
        }
    }
    logger.snormal('%s -- finished', fname);
} // _initCommands


/** Set up script columns, including user columns */
function _initColumns(initData: DOpusScriptInitData, ext: config.ScriptExt) {
    const fname = _initColumns.fname = '_initColumns';

    logger.snormal('%s -- started', fname);

    const colPrefix = scriptMeta.CUSTCOL_LABEL_PREFIX;

    const expectedJSONPath = g.SCRIPTSDIR + scriptMeta.NAME + '.json';
    const extConfig: ExtConfigType = ext.getPOJOFromFile<ExtConfigType>(CfgE.EXT_CONFIG_POJO, expectedJSONPath).match({
        ok: (contents: ExtConfigType) => {
            logger.snormal('%s -- using external JSON: %s', fname, expectedJSONPath);
            return contents;
        },
        err: (err: IException<ex>) => {
            err.show();
            logger.serror('%s -- Error:\n%s', fname, err.toString());
            return {};
        }
    });

    for (const columnName in AllColumns) {
        if (Object.prototype.hasOwnProperty.call(AllColumns, columnName)) {
            const columnParams = AllColumns[columnName];
            logger.sinfo('%s -- adding script column: %s, extConfig.colPrefix: %s', fname, columnName, extConfig.colPrefix);
            var colScript         = initData.addColumn();
            colScript.method      = g.funcNameExtractor(columnParams.func);
            colScript.name        = columnName;
            colScript.label       = (extConfig.colPrefix || colPrefix)
                                    + (typeof extConfig.colRepl === 'object' && extConfig.colRepl[columnName] || columnParams.label);
            colScript.justify     = columnParams.justify;
            colScript.autoGroup   = columnParams.autoGroup;
            colScript.autoRefresh = columnParams.autoRefresh;
            colScript.multiCol    = columnParams.multiCol;
        }
    }

    // add user-customizable columns from Container.Extra fields, e.g.
    // "colExtra": {
    //   "com_apple_quicktime_model": "Camera Make"
    // }
    if (typeof extConfig.colExtra !== 'undefined') {
        logger.sverbose('%s -- exconfig: %s', fname, JSON.stringify(extConfig, null, 4));
        var colExtraMap: DOpusMap = DOpus.create().map();
        for(var ecitem in extConfig.colExtra) {
            logger.sinfo('%s -- adding user column: %s, extConfig.colPrefix: %s', fname, ecitem, extConfig.colPrefix);
            var colExt         = initData.addColumn();
            colExt.method      = g.funcNameExtractor(OnMExt_MultiColRead);
            colExt.name        = scriptMeta.CUSTCOL_NAME_PREFIX + ecitem;
            colExt.label       = (extConfig.colPrefix || colPrefix) + extConfig.colExtra[ecitem];
            colExt.justify     = ColumnJustify.Left;
            colExt.autoGroup   = true;
            colExt.autoRefresh = true;
            colExt.multiCol    = true;
            // add to custom column lookup cache, so that we don't have to go through this again
            colExtraMap.set(ecitem, extConfig.colExtra[ecitem]);
        }
        initData.vars.set(scriptMeta.CUSTCOL_MAP_NAME, colExtraMap);
    }

    logger.snormal('%s -- finished', fname);
} // _initColumns










function OnInit(initData: DOpusScriptInitData) {
    // DOpus.clearOutput();
    DOpus.output('\n------------------------------------\n');
    DOpus.output('<b>Script initialization started</b>');

    g.init(initData, scriptMeta);   // set up script meta data for UI and misc script variables, such as script name, isOSP...
    _reinitGlobalVars(initData);    // (re)initialize logger, usr, ext
    _initConfigDefaults(usr);       // user-configurable parameters & defaults
    _initCommands(initData);        // commands available to user
    _initColumns(initData, ext);         // columns available to user

    // initData.vars.set(g.VAR_NAMES.SCRIPT_CONFIG_VALID, usr.isUserConfigValid().isOk());
    // validateConfigAndCache(initData.vars);
    mem.clear();
    nil.clear()

    // DOpus.output('OnInit() before - mem.id: ' + mem.id);
    // DOpus.output('OnInit() before - mem.isEnabled(): ' + mem.isEnabled());
    // DOpus.output('OnInit() before - mem.getCount(): ' + mem.getCount());
    mem.setVar('foo', 'bar -- set in OnInit()');
    // DOpus.output('OnInit() after - mem.id: ' + mem.id);
    // DOpus.output('OnInit() after - mem.isEnabled(): ' + mem.isEnabled());
    // DOpus.output('OnInit() after - mem.getCount(): ' + mem.getCount());


    DOpus.output('<b>Script initialization finished</b>');
}










// 32k limit workaround? https://github.com/pieroxy/lz-string/ (4.6k minified) - https://pieroxy.net/blog/pages/lz-string/index.html
function OnGetHelpContent(helpData: DOpusGetHelpContentData) {
//     const fname = OnGetHelpContent.fname = 'OnGetHelpContent';
//     DOpus.output(fname + ' started');
//     var helpContent = `<html>
// <head>
//     <title>Hello world</title>
// </head>
// <body>
//     <p>This is the body.</p>
// </body></html>
// `;
//     helpData.addHelpPage('index.html', 'C&uuml;\'s Movie Tagger', helpContent);

//     helpData.addHelpPage('details.html', 'More details', helpContent);

// var cfgopt = fs.readFile('C:\\Users\\cu\\AppData\\Roaming\\GPSoftware\\Directory Opus\\Script AddIns\\configOptions.html').ok;
// DOpus.output('cfgopt: ' + cfgopt.slice(0,1000));
// DOpus.output('cfgopt: ' + cfgopt.length);

//     helpData.addHelpPage('configOptions.html', 'Configuration', cfgopt);
}

function OnME_ShowHelp(scriptCmdData: DOpusScriptCommandData) {
    Script.showHelp();
}

function OnScriptConfigChange(_cfgChangeData: DOpusConfigChangeData) {
    validateConfig(undefined);
}

function OnME_ConfigValidate(scriptCmdData: DOpusScriptCommandData) {
    validateConfig(scriptCmdData.func.dlg());
}

/** ERROR: always shown -- OK: only shown if a dialog is passed */
function validateConfig(dialog?: DOpusDialog): IResult<true, any> {
    // const resValidation = validateConfigAndCache(Script.vars);
    const resValidation = usr.isUserConfigValid();
    const title = 'Validation results';
    resValidation.match({
        ok : () => dialog && g.showMessageDialog(dialog, 'Great! Configuration is valid.', title),
        err: () => {
            logger.sverbose('%s -- %s', 'validateConfig', JSON.stringify(resValidation.err, null, 4));
            let msg = 'Configuration is invalid:\n\n';
            for (const invalidKey in resValidation.err) {
                if (Object.prototype.hasOwnProperty.call(resValidation.err, invalidKey)) {
                    const invalidKeyType = resValidation.err[invalidKey];
                    msg += invalidKey + ' is invalid ' + invalidKeyType + '\n';
                }
            }
            g.showMessageDialog(dialog||null, msg, title);
        }
    });
    return resValidation;
}








function CustomCommand(scriptCmdData: DOpusScriptCommandData) {
    const fname = CustomCommand.fname = 'CustomCommand';


    // hashTest(scriptCmdData);
    // return;


    // _reinitGlobalVars();

    logger.sforce('%s -- started', fname);

    // logger.force('uid: ' + g.getScriptUniqueID());
    // logger.force('pvars: ' + JSON.stringify(g.getScriptPathVars(), null, 4));

    // logger.force('');
    // logger.force('');
    // logger.force('');
    // logger.force('');

    // // logger.force('cfg items: ' + cfg.getValue(CfgV.FORMATS_REGEX_VBR));
    // logger.force('cfg items: ' + config.User.getInstance().getValue(CfgU.META_STREAM_NAME));

    // // DOpus.output('function in map - typeof: ' + typeof Script.vars.get('foo'));
    // // DOpus.output('function in map: ' + Script.vars.get('foo'));
    // // DOpus.output('function in map: ' + g.funcNameExtractor.fname);
    // // DOpus.output('extracted name: ' + g.funcNameExtractor('CustomCommand'));
    // DOpus.output('extracted name: ' + g.funcNameExtractor(CustomCommand));

    // var fr = fs.readFile('Y:\\foo.txt');
    // fr.match({
    //     ok: () => { DOpus.output('result is ok: ' + fr.ok); },
    //     err: () => { DOpus.output('result is err: ' + JSON.stringify(fr, null, 4)); }
    // });

    // // var stream = ads.adsStreamCreator('dummy');
    // var stream = new ads.Stream('dummy');
    // stream.setLogger(logger);


    // // DOpus.clearOutput();
    // // DOpus.output('whole config: ' + config.User.getInstance().toString());
    // const isUserConfigValid = config.User.getInstance().isUserConfigValid();
    // DOpus.output('isUserConfigValid: ' + isUserConfigValid);
    // const isExtConfigValid = config.ScriptExt.getInstance().isUserConfigValid();
    // DOpus.output('isExtConfigValid: ' + isExtConfigValid);

    // logger.sforce('%s -- debug level: %s', fname, config.User.getInstance().getValue(CfgU.DEBUG_LEVEL));

    // logger.sforce('%s -- ext pojo: %s', fname, config.ScriptExt.getInstance().getValue(CfgE.EXT_CONFIG_POJO));
    // logger.sforce('%s -- ext pojo2: %s', fname, JSON.stringify(config.ScriptExt.getInstance().getValue(CfgE.EXT_CONFIG_POJO), null, 4));

    // logger.sforce('This should be visible in none');
    // logger.serror('This should be visible in error');
    // logger.swarn('This should be visible in warn');
    // logger.snormal('This should be visible in normal');
    // logger.sinfo('This should be visible in info');
    // logger.sverbose('This should be visible in verbose');

    // validateConfig(scriptCmdData);
    // OnME_ConfigValidate(scriptCmdData);

    DOpus.output('before mem.id: ' + mem.id);
    DOpus.output('before mem.isEnabled(): ' + mem.isEnabled());
    DOpus.output('before mem.getCount(): ' + mem.getCount());

    DOpus.output('mem.getVar("foo"): ' + mem.getVar('foo'));
    DOpus.output('mem.getVar("nonexisting"): ' + mem.getVar('nonexisting').isNone());
    DOpus.output('mem.getVar("nonexisting"): ' + mem.getVar('nonexisting').orElse('default value'));
    mem.setVar('hello', 'world');

    DOpus.output('after mem.id: ' + mem.id);
    DOpus.output('after mem.isEnabled(): ' + mem.isEnabled());
    DOpus.output('after mem.getCount(): ' + mem.getCount());

    mem.disable();
    DOpus.output('mem.isEnabled(): ' + mem.isEnabled());
    mem.enable();
    DOpus.output('mem.isEnabled(): ' + mem.isEnabled());

    DOpus.output('mem.getKeys(): ' + mem.getKeys());

    g.ResultErr('error').show();
    g.ResultOk('ok').show();

    // DOpus.output('sw.myName: ' + sw.startAndPrint('foo'));
    // DOpus.output('sw.myName: ' + sw.getElapsedAndPrint('foo'));
    // DOpus.output('sw.myName: ' + sw.stopAndPrint('foo'));

    // DOpus.output('sw.myName: ' + sw.start('foo'));
    // DOpus.output('sw.myName: ' + sw.getElapsed('foo'));
    // DOpus.output('sw.myName: ' + sw.reset('foo'));
    // DOpus.output('sw.myName: ' + sw.stop('foo'));

    // DOpus.output('sw.myName: ' + sw.start('foo').print());
    // g.delay(100);
    // DOpus.output('sw.myName: ' + sw.getElapsed('foo').print());
    // g.delay(100);
    // // DOpus.output('sw.myName: ' + sw.reset('foo').print());
    // g.delay(100);
    // DOpus.output('sw.myName: ' + sw.stop('foo').print());


    // try {
    //     var fh = g.fsu.openFile('Y:\\foo.txt');
    //     DOpus.output('bam 1!');
    //     var blob = fh.read();
    //     DOpus.output('bam 2!');
    // } catch (e) {
    //     DOpus.output('e occurred: ' + e.description);
    //     return;
    // } finally {
    //     DOpus.output('this is finally');
    // }
    // var str = fs.readFile('Y:\\foo.txt');
    // DOpus.output('str: ' + str);

    // var num = 12345678901234567890 + 40000;
    // DOpus.output(g2.sprintf('%s -- %s', Math.pow(2,10), num ));


    var vic = g.getItem('Y:\\foo.txt');
    // var st = new ads.Stream('Test');
    var st = new ads.Stream('This is another stream');
    st.setLogger(logger);
    var resSave = st.save(vic, new ads.CachedItem(vic));
    logger.sforce('%s -- resSve: %s', fname, JSON.stringify(resSave, null, 4));

    resSave.show();

    var resCachedItem = st.read(vic);
    if (resCachedItem.isErr()) {
        DOpus.output('resCachedItem.err: ' + resCachedItem.err);
        return;
    }
    DOpus.output('resCachedItem.ok: ' + resCachedItem.ok);





    logger.sforce('%s -- finished', fname);
}










// called by 'Has Metadata' column
function OnMExt_HasMetadata(colData: DOpusScriptColumnData) {
    const fname = OnMExt_HasMetadata.fname = 'OnMExt_HasMetadata';
    // logger.sforce('%s -- running', fname);

    var selected_item = colData.item;
    if (selected_item.is_dir || selected_item.is_reparse || selected_item.is_junction || selected_item.is_symlink) {
        return;
    }
    logger.normal('Checking ' + selected_item.realpath + ':' + usr.getValue(CfgU.META_STREAM_NAME).show().ok);

    var exists = DOpus.fsUtil().exists(selected_item.realpath + ':' + usr.getValue(CfgU.META_STREAM_NAME).show().ok);

    colData.value = exists ? 'Yes' : 'No';
    colData.group = 'Has Metadata: ' + colData.value;
    // return exists;
}

// called by all other columns than 'Has Metadata'
function OnMExt_MultiColRead(scriptColData: DOpusScriptColumnData) {
    const fname = OnMExt_MultiColRead.fname = 'OnMExt_MultiColRead';
    // var ts1 = new Date().getTime();

    // var selected_item   = scriptColData.item;
    // if (selected_item.is_dir || selected_item.is_reparse || selected_item.is_junction || selected_item.is_symlink ) {
    //     return;
    // }
    // logger.normal('...Processing ' + selected_item.name);

    // // get tags object
    // var item_props = ReadMetadataADS(selected_item);
    // if (item_props === false || typeof item_props === 'undefined' || !isObject(item_props)) {
    //     logger.normal(selected_item.name + ': Metadata does not exist or INVALID');
    //     return;
    // }

    // var _vcodec, _acodec, _resolution;
    // var colExtraMap = Script.vars.get(CUSTCOL_MAP_NAME);

    // // iterate over requested columns
    // for (var e = new Enumerator(scriptColData.columns); !e.atEnd(); e.moveNext()) {
    //     var key = e.item();

    //     var outstr = '', _tmp0, _tmp1, _tmp2, _tmp3, _tmp4, _tmp5, _tmp6, _tmp7;
    //     switch(key) {
    //         case 'MExt_NeedsUpdate':
    //             if (!config.get('keep_orig_modts')) {
    //                 scriptColData.columns(key).value = 'meaningless if KEEP_ORIG_MODTS is set to false';
    //                 break;
    //             }
    //             outstr = new Date(selected_item.modify).valueOf() === item_props.last_modify ? 0 : 1;
    //             logger.verbose('Old: ' + new Date(selected_item.modify).valueOf() + ' <> ' + item_props.last_modify);
    //             scriptColData.columns(key).group = 'Needs update: ' + (outstr ? 'Yes' : 'No');
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_ADSDataRaw':
    //             scriptColData.columns(key).value = JSON.stringify(item_props);
    //             break;

    //         case 'MExt_ADSDataFormatted':
    //             scriptColData.columns(key).value = JSON.stringify(item_props, null, "\t");
    //             break;

    //         case 'MExt_HelperContainer':
    //             outstr = 'Format: [' + item_props.container_format + '], Codec: [' + item_props.container_codec + '], EncApp: [' + item_props.container_enc_app + '], VCount: [' + item_props.video_count + '], ACount: [' + item_props.audio_count + '], TCount: [' + item_props.text_count + '], OCount: [' + item_props.others_count + '], Additional: [' + item_props.format_additional + '], Extra: [' + JSON.stringify(item_props.extra) + ']';
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_HelperVideoCodec':
    //             outstr = 'Format: [' + item_props.video_format + '], Codec: [' + item_props.video_codec + '], EncLibName: [' + item_props.video_enc_libname + '], Additional: [' + item_props.video_format_additional + '], Extra: [' + JSON.stringify(item_props.video_extra) + ']';
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_HelperAudioCodec':
    //             outstr = 'Format: [' + item_props.audio_format + '], Codec: [' + item_props.audio_codec + '], Version: [' + item_props.audio_format_version + '], Profile: [' + item_props.audio_format_profile + '], Settings Mode: [' + item_props.audio_format_set_mode + '], Additional: [' + item_props.audio_format_additional + '], Extra: [' + JSON.stringify(item_props.audio_extra) + ']';
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_VideoCount':
    //             outstr = item_props.video_count || 0;
    //             scriptColData.columns(key).group = '# Video Streams: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_AudioCount':
    //             outstr = item_props.audio_count || 0;
    //             scriptColData.columns(key).group = '# Audio Streams: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_TextCount':
    //             outstr = item_props.text_count || 0;
    //             scriptColData.columns(key).group = '# Text/Subtitle Streams: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_OthersCount':
    //             outstr = item_props.others_count || 0;
    //             scriptColData.columns(key).group = '# Other Streams: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;


    //         case 'MExt_CleanedUpName':
    //         case 'MExt_VideoCodec':
    //             if (!item_props.video_count) {
    //                 scriptColData.columns(key).sort = 0;
    //                 // this grouping makes sense mainly in mixed-format directories
    //                 scriptColData.columns(key).group = 'Video Codec: ' + (item_props.audio_count ? '<Audio Only>' : '');
    //                 break;
    //             }
    //             // add alternative '' to the end if you concatenate multiple fields
    //             _tmp0 = item_props.container_format.toUpperCase();
    //             _tmp1 = (item_props.video_format + '-' + item_props.video_codec + '-' + item_props.video_enc_libname).toUpperCase() || '';	// note last ''
    //             _tmp2 = (item_props.video_format + '-' + item_props.video_codec).toUpperCase() || '';										// note last ''
    //             _tmp3 = (item_props.video_format + '-' + item_props.video_enc_libname).toUpperCase() || '';	// note last ''
    //             _tmp4 = (item_props.video_format).toUpperCase() || '';
    //             _tmp5 = (item_props.video_codec).toUpperCase() || '';

    //             var lcv = config.get('lookup_codecs');
    //             outstr = 	lcv[_tmp0+'-'+_tmp1] ||
	// 						lcv[_tmp0+'-'+_tmp2] ||
	// 						lcv[_tmp0+'-'+_tmp3] ||
	// 						lcv[_tmp0+'-'+_tmp4] ||
	// 						lcv[_tmp0+'-'+_tmp5] ||
	// 						lcv[_tmp1] ||
	// 						lcv[_tmp2] ||
	// 						lcv[_tmp3] ||
	// 						lcv[_tmp4] ||
	// 						lcv[_tmp5];
    //             if (outstr && outstr.length === 2) {
    //                 outstr = config.get('codec_use_short_variant') === true ? outstr[1] : outstr[0];
    //             }
    //             outstr = outstr ||
	// 						(
	// 						    item_props.video_format +
	// 							' (Fallback, adjust LOOKUP_CODECS)'
	// 							// (item_props.video_format_additional ? ' (' + item_props.video_format_additional + ')' : '')
	// 						);
    //             scriptColData.columns(key).group = 'Video Codec: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             _vcodec = outstr; // buffer for 'Clean Name'
    //             break;


    //         case 'MExt_CleanedUpName':
    //         case 'MExt_AudioCodec':
    //             if (!item_props.audio_count) {
    //                 scriptColData.columns(key).sort = 0;
    //                 // this grouping makes sense mainly in mixed-format directories
    //                 scriptColData.columns(key).group = 'Audio Codec: ' + (item_props.video_count ? '<Video Only>' : '');
    //                 break;
    //             }
    //             // add alternative '' to the end if you concatenate multiple fields
    //             _tmp0 = item_props.container_format.toUpperCase();
    //             _tmp1 = (item_props.audio_format + '-' + item_props.audio_codec + '-' + item_props.audio_format_version + '-' + item_props.audio_format_profile + '-' + item_props.audio_format_set_mode).toUpperCase() || '';	// note last ''
    //             _tmp2 = (item_props.audio_format + '-' + item_props.audio_codec + '-' + item_props.audio_format_version + '-' + item_props.audio_format_profile).toUpperCase() || '';	// note last ''
    //             _tmp3 = (item_props.audio_format + '-' + item_props.audio_codec + '-' + item_props.audio_format_version).toUpperCase() || ''; 											// note last ''
    //             _tmp4 = (item_props.audio_format + '-' + item_props.audio_codec).toUpperCase() || ''; 																					// note last ''
    //             _tmp5 = (item_props.audio_format).toUpperCase() || ''; 																													// note last ''
    //             _tmp6 = (item_props.audio_codec).toUpperCase() || '';
    //             _tmp7 = (item_props.audio_format + '-' + item_props.audio_format_profile).toUpperCase() || ''; 																			// note last ''


    //             logger.verbose(selected_item.name + "\t" + '_tmp0: ' + _tmp0 + ', _tmp1: ' + _tmp1 + ', _tmp2: ' + _tmp2 + ', _tmp3: ' + _tmp3 + ', _tmp4: ' + _tmp4 + ', _tmp5: ' + _tmp5 + ', _tmp6: ' + _tmp6 + ', _tmp7: ' + _tmp7);

    //             var lca = config.get('lookup_codecs');
    //             outstr = 	lca[_tmp0+'-'+_tmp1] ||
	// 						lca[_tmp0+'-'+_tmp2] ||
	// 						lca[_tmp0+'-'+_tmp3] ||
	// 						lca[_tmp0+'-'+_tmp4] ||
	// 						lca[_tmp0+'-'+_tmp5] ||
	// 						lca[_tmp1] ||
	// 						lca[_tmp2] ||
	// 						lca[_tmp3] ||
	// 						lca[_tmp4] ||
	// 						lca[_tmp5] ||
	// 						lca[_tmp6] ||
	// 						lca[_tmp7];
    //             if (outstr && outstr.length === 2) {
    //                 outstr = config.get('codec_use_short_variant') === true ? outstr[1] : outstr[0];
    //             }

    //             outstr = outstr || (
    //                 item_props.audio_format +
	// 							' (Fallback, adjust LOOKUP_CODECS)'
	// 							// (item_props.audio_format_additional ? ' (' + item_props.audio_format_additional + ')' : '')
    //             );
    //             scriptColData.columns(key).group = outstr;
    //             // add additional info always to the end, some codecs like AAC, DSD use this heavily
    //             if (config.get('codec_append_addinfo')) {
    //                 outstr += (item_props.audio_format_additional ? ' (' + item_props.audio_format_additional + ')' : '');
    //             }
    //             scriptColData.columns(key).group = 'Audio Codec: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             _acodec = outstr; // buffer for 'Clean Name'
    //             break;

    //         case 'MExt_VideoBitrate':
    //             if (!item_props.video_count) { scriptColData.columns(key).sort = 0; break; }
    //             if (item_props.container_format === 'Flash Video' && item_props.video_format ===  'Sorenson Spark') {
    //                 item_props.video_bitrate = item_props.overall_bitrate - item_props.audio_bitrate;
    //                 logger.error(selected_item.name + ' -- FALLBACK 1 detected while calculating video bitrate: ' + item_props.video_bitrate);
    //             }
    //             outstr = Math.floor((item_props.video_bitrate || 0) / 1000);
    //             scriptColData.columns(key).sort = outstr;
    //             outstr = outstr ? outstr + ' kbps' : '';
    //             scriptColData.columns(key).group = 'Video Bitrate: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_AudioBitrate':
    //             if (!item_props.audio_count) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = Math.floor((item_props.audio_bitrate || 0) / 1000);
    //             if (!outstr) {
    //             // try alternative methods: filesize or streamsize * 8 / duration
    //             // it will fail for raw AAC files, since they do not store any bitrate or duration info at all
    //             // but might work for other files
    //                 var duration = item_props.audio_duration || item_props.duration || selected_item.metadata.mp3songlength || 0;
    //                 if (duration) {
    //                     if (item_props.audio_stream_size) {
    //                         outstr = item_props.audio_stream_size * 8 / duration;
    //                     } else if (item_props.video_count === 0 && item_props.file_size && item_props.audio_count) {
    //                         outstr = item_props.file_size * 8 / duration;
    //                     }

    //                     outstr = Math.round(outstr / 1000);
    //                     if (selected_item.metadata && selected_item.metadata.video && selected_item.metadata.video.mp3bitrate) {
    //                     // this is only for audio-only .TS files, for which MediaInfo cannot parse the audio bitrate
    //                     // but if we have the overall bitrate, we can subtract the 'video bitrate', which are in fact for DVD menus, etc.
    //                         outstr = selected_item.metadata.video.mp3bitrate;
    //                         logger.normal(selected_item.name + ' -- FALLBACK 1 detected while calculating audio bitrate: ' + outstr);
    //                     }
    //                 }
    //                 if (!outstr && selected_item.metadata && selected_item.metadata.audio && selected_item.metadata.audio.mp3bitrate) {
    //                     outstr = selected_item.metadata.audio.mp3bitrate;
    //                     logger.normal(selected_item.name + ' -- FALLBACK 2 detected while calculating audio bitrate: ' + outstr);
    //                 }
    //             }
    //             scriptColData.columns(key).sort = outstr;
    //             outstr = outstr ? outstr + ' kbps' : '';
    //             scriptColData.columns(key).group = 'Audio Bitrate: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_TotalBitrate':
    //             outstr = Math.floor((item_props.overall_bitrate || 0) / 1000);
    //             scriptColData.columns(key).sort = outstr;
    //             outstr = outstr ? outstr + ' kbps' : '';
    //             scriptColData.columns(key).group = 'Total Bitrate: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;


    //         case 'MExt_TotalDuration':
    //         case 'MExt_VideoDuration':
    //         case 'MExt_AudioDuration':
    //         case 'MExt_CombinedDuration':
    //             var td = item_props.duration,
    //                 vd = item_props.video_duration,
    //                 ad = item_props.audio_duration;
    //             var tolerance = 5;
    //             var extended_info_on_mismatch = false;
    //             var grpPrefix;
    //             switch(key) {
    //                 case 'MExt_TotalDuration':		grpPrefix = 'Total '; break;
    //                 case 'MExt_VideoDuration':		grpPrefix = 'Video '; break;
    //                 case 'MExt_AudioDuration':		grpPrefix = 'Audio '; break;
    //                 case 'MExt_CombinedDuration':	grpPrefix = ''; break;
    //             }

    //             if (key === 'MExt_AudioDuration' && !item_props.audio_count) {
    //                 logger.normal('Col: ' + key + "\t" + selected_item.name + ' -- FALLBACK A1 - No audio');
    //                 scriptColData.columns(key).value = item_props.audio_bitrate ? '≠00:00' : '';
    //                 scriptColData.columns(key).sort  = scriptColData.columns(key).value || '00:00';
    //                 scriptColData.columns(key).group = grpPrefix + 'Duration: No Audio';
    //                 break;
    //             } else if (key === 'MExt_VideoDuration' && !item_props.video_count) {
    //                 logger.normal('Col: ' + key + "\t" + selected_item.name + ' -- FALLBACK V1 - No video');
    //                 scriptColData.columns(key).value = item_props.video_bitrate ? '≠00:00' : '';
    //                 scriptColData.columns(key).sort  = '00:00';
    //                 scriptColData.columns(key).group = grpPrefix + 'Duration: No Video';
    //                 break;
    //             } else if ((key === 'MExt_TotalDuration' || key === 'MExt_CombinedDuration') && !item_props.video_count && !item_props.audio_count) {
    //                 logger.force('Col: ' + key + "\t" + selected_item.name + ' -- This should have never happened!\nVideo count: ' + item_props.video_count + ', Audio count: ' + item_props.audio_count);
    //                 break;
    //             }

    //             if (key === 'MExt_AudioDuration' && ad) {
    //                 outstr = SecondsToHHmm(ad);
    //             } else if (key === 'MExt_VideoDuration' && vd) {
    //                 outstr = SecondsToHHmm(vd);
    //             } else if (key === 'MExt_TotalDuration' && td) {
    //                 outstr = SecondsToHHmm(td);
    //             } else if (key === 'MExt_CombinedDuration') {
    //                 outstr = SecondsToHHmm(td);
    //             }

    //             if (key === 'MExt_CombinedDuration') {
    //                 if (td && vd && ad) {
    //                 // all 3 exist
    //                     if (
    //                         (td === vd || (td >= vd && td-tolerance <= vd) || (td <= vd && td-tolerance >= vd) ) &&
	// 						(td === ad || (td >= ad && td-tolerance <= ad) || (td <= ad && td-tolerance >= ad) ) &&
	// 						(vd === ad || (td >= ad && td-tolerance <= ad) || (td <= ad && td-tolerance >= ad) )
    //                     ) {
    //                         logger.info(sprintf("All exist, all within tolerance limits -- td: %s, vd: %s, ad: %s", td, vd, ad));
    //                         outstr = SecondsToHHmm(td);
    //                     } else {
    //                         logger.info(sprintf("Col: %s\t%s All exist, some outside tolerance limits -- td: %s, vd: %s, ad: %s", key, selected_item.name, td, vd, ad));
    //                         outstr += (!extended_info_on_mismatch ? ' (!)' :
    //                             ' ('
	// 									+ ( td ? 'T: '  + SecondsToHHmm(td) : '' )
	// 									+ ( vd ? ' V: ' + SecondsToHHmm(vd) : '' )
	// 									+ ( ad ? ' A: ' + SecondsToHHmm(ad) : '' )
	// 									+ ')');
    //                     }
    //                 } else if (!td && !vd && !ad) {
    //                 // none of 3 exists - but if we are this far, we have at least 1 video or audio stream
    //                     outstr = '≠00:00';
    //                 } else {
    //                     logger.info(sprintf("Only some exist -- td: %s, vd: %s, ad: %s", td, vd, ad));
    //                     // check for tolerance
    //                     if 	(
    //                         (td && vd && td >= vd && td - tolerance <= vd) ||	// only slightly longer
	// 							(td && ad && td >= ad && td - tolerance <= ad) ||	// only slightly longer
	// 							(vd && ad && vd >= ad && vd - tolerance <= ad) ||	// only slightly longer
	// 							(td && vd && td <= vd && td + tolerance >= vd) ||	// only slightly shorter
	// 							(td && ad && td <= ad && td + tolerance >= ad) ||	// only slightly shorter
	// 							(vd && ad && vd <= ad && vd + tolerance >= ad) 	// only slightly shorter
    //                     ) {
    //                     // within tolerance limit
    //                         logger.verbose(sprintf("Some within tolerance limits -- td: %s, vd: %s, ad: %s", td, vd, ad));
    //                         logger.verbose(sprintf("Some within tolerance limits -- %s <= %s <= %s", (td - tolerance), vd, (td + tolerance) ));
    //                         logger.verbose(sprintf("Some within tolerance limits -- %s <= %s <= %s", (td - tolerance), ad, (td + tolerance) ));
    //                         outstr = SecondsToHHmm(td);
    //                     } else {
    //                         logger.verbose(sprintf("Some outside tolerance limits -- td: %s, vd: %s, ad: %s", td, vd, ad));
    //                         logger.verbose(sprintf("Some outside tolerance limits -- %s <= %s <= %s", (td - tolerance), vd, (td + tolerance) ));
    //                         logger.verbose(sprintf("Some outside tolerance limits -- %s <= %s <= %s", (td - tolerance), ad, (td + tolerance) ));
    //                         outstr += (!extended_info_on_mismatch ? ' (!)' :
    //                             ' ('
	// 									+ ( td ? 'T: '  + SecondsToHHmm(td) : '' )
	// 									+ ( vd ? ' V: ' + SecondsToHHmm(vd) : '' )
	// 									+ ( ad ? ' A: ' + SecondsToHHmm(ad) : '' )
	// 									+ ')');
    //                     }
    //                 }
    //             }

    //             var ldg = config.get('lookup_duration_groups');
    //             if (ldg) {
    //                 for (var kd in ldg) {
    //                     if (item_props.audio_duration <= parseInt(kd)) {
    //                         scriptColData.columns(key).group = grpPrefix + 'Duration: ' + ldg[kd]; break;
    //                     }
    //                 }
    //             } else {
    //                 scriptColData.columns(key).group = grpPrefix + 'Duration: ' + outstr;
    //             }

    //             switch(key) {
    //                 case 'MExt_TotalDuration':
    //                     scriptColData.columns(key).sort  = outstr || (item_props.overall_bitrate || item_props.duration ? '00:01' : '00:00');
    //                     scriptColData.columns(key).value = outstr || (item_props.overall_bitrate || item_props.duration ? '≠00:00' : '');
    //                     break;
    //                 case 'MExt_VideoDuration':
    //                     scriptColData.columns(key).sort  = outstr || (item_props.video_bitrate || item_props.video_count ? '00:01' : '00:00');
    //                     scriptColData.columns(key).value = outstr || (item_props.video_bitrate || item_props.video_count ? '≠00:00' : '');
    //                     break;
    //                 case 'MExt_AudioDuration':
    //                     scriptColData.columns(key).sort  = outstr || (item_props.audio_bitrate || item_props.audio_count ? '00:01' : '00:00');
    //                     scriptColData.columns(key).value = outstr || (item_props.audio_bitrate || item_props.audio_count ? '≠00:00' : '');
    //                     break;
    //                 case 'MExt_CombinedDuration':
    //                     scriptColData.columns(key).sort  = outstr;
    //                     scriptColData.columns(key).value = outstr;
    //                     break;
    //             }
    //             break;


    //         case 'MExt_MultiAudio':
    //             outstr = (item_props.audio_count > 1 ? 'Yes' : 'No');
    //             scriptColData.columns(key).group = 'Has Multi-Track Audio: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_AudioChannels':
    //             outstr = item_props.audio_channels || '';
    //             if (!outstr) {
    //                 if (item_props.audio_count) {
    //                 // audio track does not report number of channels but file has audio! - only happens with Musepack & Raw DTS in my tests
    //                     scriptColData.columns(key).sort = 1;
    //                     outstr = 'X';
    //                 } else {
    //                     scriptColData.columns(key).sort = 0;
    //                     outstr = '0';
    //                 }
    //             }
    //             scriptColData.columns(key).group = 'Audio Channels: ' + (outstr || ''); // must come before next line, outstr is ' ' for empty!
    //             var lc = config.get('lookup_channels');
    //             if (lc) {
    //                 outstr = lc[outstr] ? lc[outstr] : outstr;
    //                 scriptColData.columns(key).group = 'Audio Channels: ' + (outstr === lc['0'] ? 'None' : outstr);
    //             }
    //             scriptColData.columns(key).value = outstr;
    //             break;


    //         case 'MExt_AudioLang':
    //             if (!item_props.audio_count) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.audio_language ? item_props.audio_language.toUpperCase() : '';
    //             scriptColData.columns(key).group = 'Audio Language: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_VARDisplay':
    //             if (!item_props.video_count) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.video_display_AR || '';
    //             scriptColData.columns(key).group = 'Display Aspect Ratio: ' + outstr;
    //             scriptColData.columns(key).sort = outstr || 0;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_VARRaw':
    //             if (!item_props.video_count) { scriptColData.columns(key).sort = 0; break; }
    //             // outstr = item_props.video_width && item_props.video_height ? Math.toPrecision( item_props.video_width / item_props.video_height, 3) : 'n/a' ;
    //             // no toPrecision() support in JScript
    //             outstr = item_props.video_width && item_props.video_height ? Math.round(1000*item_props.video_width/item_props.video_height)/1000 : 'n/a' ;
    //             scriptColData.columns(key).group = 'Raw Aspect Ratio: ' + outstr;
    //             scriptColData.columns(key).sort = outstr || 0;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_VARCombined':
    //             if (!item_props.video_count) { scriptColData.columns(key).sort = 0; break; }
    //             var _rawAR  = item_props.video_width && item_props.video_height ? Math.round(1000*item_props.video_width/item_props.video_height)/1000 : '';
    //             var _dispAR = item_props.video_display_AR || '';
    //             logger.verbose(selected_item.name + ', raw: ' + _rawAR + ', disp: ' + _dispAR);
    //             // outstr = _rawAR + (_rawAR != _dispAR ? ' (' + _dispAR + ')' : ''); // display
    //             outstr = _rawAR + (_rawAR != _dispAR ? ' (' + _dispAR + ')' : '');
    //             scriptColData.columns(key).group = 'Combined Aspect Ratio: ' + outstr;
    //             scriptColData.columns(key).sort  = _rawAR || 0;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_VDimensions':
    //             if (!item_props.video_count) { scriptColData.columns(key).sort = 0; break; }
    //             // Variant 1: default to MediaInfo value
    //             outstr = (item_props.video_width && item_props.video_height ? item_props.video_width + ' x ' + item_props.video_height : selected_item.metadata.video.dimensions) || '' ;
    //             // Variant 2: default to DOpus value - not tested
    //             // outstr = selected_item.metadata.video.dimensions || (item_props.video_width && item_props.video_height ? item_props.video_width + ' x ' + item_props.video_height : '');
    //             scriptColData.columns(key).group = 'Dimensions: ' + outstr;
    //             scriptColData.columns(key).sort  = outstr || 0;
    //             scriptColData.columns(key).value = outstr;
    //             break;


    //         case 'MExt_CleanedUpName':
    //         case 'MExt_VResolution':
    //             if (!item_props.video_count || !item_props.video_width || !item_props.video_height) { scriptColData.columns(key).sort = 0; break; }
    //             var res_val = Math.min(item_props.video_height, item_props.video_width);
    //             var lr = config.get('lookup_resolutions');
    //             for (var kr in lr) {
    //                 if (res_val <= parseInt(kr)) {
    //                     outstr = lr[kr];
    //                     break; // for
    //                 }
    //             }
    //             if (item_props.video_height >= item_props.video_width && config.get('resolution_append_vertical')) {
    //                 outstr += ' (Vertical)';
    //             }
    //             scriptColData.columns(key).group = 'Resolution: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             _resolution = outstr; // buffer for 'Clean Name'
    //             break;

    //         case 'MExt_VFrameRate':
    //             if (!item_props.video_count) { scriptColData.columns(key).sort = 0; break; }
    //             // Variant 1: default to MediaInfo value
    //             outstr = (item_props.video_framerate ? item_props.video_framerate + ' fps': selected_item.metadata.video.framerate) || '' ;
    //             // Variant 2: default to DOpus value - not tested
    //             // outstr = selected_item.metadata.video.framerate || (item_props.video_framerate ? item_props.video_framerate + ' fps' : '');
    //             scriptColData.columns(key).group = 'Frame Rate: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_VFrameCount':
    //             if (!item_props.video_count) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.video_framecount ? item_props.video_framecount : '' ;
    //             scriptColData.columns(key).group = 'Frame Count: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_AudioBitrateMode':
    //             outstr = item_props.audio_bitrate_mode || '';
    //             scriptColData.columns(key).group = 'Audio Bitrate Mode: ' + (outstr || 'Unknown/Not Reported');
    //             scriptColData.columns(key).sort = outstr || 0;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_AudioCompressionMode':
    //             outstr = item_props.audio_compression_mode || '';
    //             scriptColData.columns(key).group = 'Audio Compression Mode: ' + (outstr || 'Unknown');
    //             scriptColData.columns(key).sort  = outstr || 0;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_HasReplayGain':
    //             outstr = item_props.has_replay_gain ? 'Yes' : '';
    //             scriptColData.columns(key).group = 'Has ReplayGain: ' + (outstr || 'No');
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_SubtitleLang':
    //             if (!item_props.text_count) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.text_language ? item_props.text_language.toUpperCase() : '';
    //             scriptColData.columns(key).group = 'Subtitle Language: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_GrossByterate':
    //             if (!item_props.video_count) { scriptColData.columns(key).sort = 0; break; }
    //             // this column shows the gross byterate (not bitrate) of the file, i.e. filesize/duration in KB
    //             // see next column below
    //             if (item_props.duration) {
    //                 outstr = Math.round( Math.round( selected_item.size / item_props.duration ) / 1024 );
    //             }
    //             scriptColData.columns(key).group = 'Gross Byterate: ' + outstr + ' kBps';
    //             scriptColData.columns(key).sort  = outstr || 0;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_VBitratePerPixel':
    //             if (!item_props.video_count) { scriptColData.columns(key).sort = 0; break; }
    //             // this column shows the gross bits per pixel per second, i.e. video_size*8/(duration*width*height)
    //             // it is a very rough metric to show how 'efficient' the video compression of a file is
    //             // to me it does not make sense for audio files, because most users are well familiar with audio bitrates, often simply 2.0 44.1/48 kHz files
    //             //
    //             // this value does not need to be very high with higher res videos or very low with low res videos
    //             // ideally the higher the resolution, the higher bitrate should be
    //             // but if you use a lossless video codec or very high bitrate e.g. 3000 kbps for a tiny 320x240 video,
    //             // then this value will be accordingly very high
    //             // and similarly if you use e.g. a mere 3000 kbps for a 4K video, this value will be lower than it should;
    //             // typical bitrate/pixel: 1.5 to 7 for 4K movies in my samples, e.g. 10000 to 50000 kps
    //             // values like > 30 should be encountered only for lossless codecs like HuffYUV, not lossy codecs
    //             // personally I find a value above ~10-15 for this column is too high (possible reason: old/inefficient codec or bitrate wasted)
    //             // and a value below 1 is too low (possible reason: too heavily compressed, for streaming-only, blocking effects)
    //             // but some files with large static areas can be compressed very well and
    //             // newer codecs like HEVC/X265 are great at very low bitrates
    //             //
    //             // so there's no universal formula
    //             // just experiment and see or use this as a template for your own formula
    //             if (item_props.video_bitrate && item_props.video_width && item_props.video_height) {
    //             // round to 3 decimal digits
    //                 outstr = Math.round( 1000 * ( item_props.video_bitrate / ( item_props.video_width * item_props.video_height ) ) ) / 1000;
    //             }
    //             scriptColData.columns(key).group = 'Bitrate/Pixel: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_VEncLibName':
    //             if (!item_props.video_enc_libname) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.video_enc_libname || '';
    //             scriptColData.columns(key).group = 'Encoded Library Name: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_VEncLib':
    //             if (!item_props.video_enc_lib) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.video_enc_lib || '';
    //             scriptColData.columns(key).group = 'Encoded Library: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;


    //         case 'MExt_VCodecID':
    //             if (!item_props.video_codec) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.video_codec || '';
    //             scriptColData.columns(key).group = 'Video Codec ID: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_ACodecID':
    //             if (!item_props.audio_codec) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.audio_codec || '';
    //             scriptColData.columns(key).group = 'Audio Codec ID: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_AFormatVersion':
    //             if (!item_props.audio_format_version) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.audio_format_version || '';
    //             scriptColData.columns(key).group = 'Audio Format Version: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_AProfile':
    //             if (!item_props.audio_format_profile) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.audio_format_profile || '';
    //             scriptColData.columns(key).group = 'Audio Format Profile: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_EncoderApp':
    //             if (!item_props.container_enc_app) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.container_enc_app || '';
    //             scriptColData.columns(key).group = 'Encoder App: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_DateEncoded':
    //             if (!item_props.container_date_encoded) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.container_date_encoded || '';
    //             scriptColData.columns(key).group = 'Date Encoded: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         case 'MExt_DateTagged':
    //             if (!item_props.container_date_tagged) { scriptColData.columns(key).sort = 0; break; }
    //             outstr = item_props.container_date_tagged || '';
    //             scriptColData.columns(key).group = 'Date Tagged: ' + outstr;
    //             scriptColData.columns(key).value = outstr;
    //             break;

    //         default:
    //             // check if there are any user-defined fields
    //             if(colExtraMap.exists(key)){
    //                 if (!item_props.extra[key]) { scriptColData.columns(key).sort = 0; break; }
    //                 outstr = item_props.extra[key] || '';
    //                 scriptColData.columns(key).group = colExtraMap.get(key) + ': ' + outstr;
    //                 scriptColData.columns(key).value = outstr;
    //             } else {
    //                 // nothing, default to empty string
    //                 outstr = '';
    //             }
    //     } // switch

    // } // for enum

    // // // DOpus.output('name_cleanup: ' + JSON.stringify(config.get('name_cleanup'), null, 4));
    // // if (config.get('name_cleanup')) {
    // // 	key = 'MExt_CleanedUpName';
    // // 	outstr = getCleanName(selected_item, _vcodec, _acodec, _resolution);
    // // 	scriptColData.columns(key).group = 'Clean Name: ' + outstr;
    // // 	scriptColData.columns(key).value = outstr;
    // // }


    // var ts2 = new Date().getTime();
    // logger.verbose('OnMExt_MultiColRead() -- Elapsed: ' + (ts2 - ts1) + ', current: ' + ts2);
}

function getCleanName(oItem: DOpusItem, sVCodec: string, sACodec: string, sResolution: string) {
    const fname = getCleanName.fname = 'getCleanName';
    // // DOpus.output('oItem.name_stem: ' + oItem.name_stem + ' - ' + sVCodec  + ' ' + sACodec + ' ' + sResolution);

    // var reDateMatcher = new RegExp(/^(.+?)\s*(\d{4})/);

    // var oldNameStem, oldExt, newNameStem, newExt;
    // // If we're renaming a file then remove the extension from the end and save it for later.
    // if (oItem.is_dir || oItem.is_junction || oItem.is_reparse || oItem.is_symlink) {
    //     return oItem.name;
    // } else {
    //     oldNameStem = oItem.name_stem;
    //     oldExt      = oItem.ext;
    // }

    // var nameCleanupRegexes = config.get('name_cleanup'),
    //     arrNameOnly        = nameCleanupRegexes.nameOnly,
    //     arrExtOnly         = nameCleanupRegexes.extOnly;

    // function massREReplace(str, arrRegexps) {
    //     var out = str;
    //     for (var i = 0; i < arrRegexps.length; i++) {
    //         var r = arrRegexps[i];
    //         out = out.replace(new RegExp(r[0], r[1]), r[2]);
    //     }
    //     return out;
    // }

    // newNameStem = massREReplace(oldNameStem, arrNameOnly);
    // newExt      = massREReplace(oldExt,      arrExtOnly);

    // // now that we have the names, find the year
    // var year = newNameStem.match(reDateMatcher);
    // if (year) {
    //     newNameStem = year[1] + ' - ' + year[2] + ' - ' + sVCodec + ' ' + sACodec + ' ' + sResolution;
    //     // get rid of extra dash's if the file was already renamed
    //     newNameStem = newNameStem.replace(/-\s*-/g, '-');
    // }

    // return newNameStem + newExt;

}



// UPDATE METADATA
function OnME_Update(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_Update.fname = 'OnME_Update';
    // if (!validateConfigAndShowResult(false, scriptCmdData.func.Dlg, true)) return;

    // scriptCmdData.func.command.SetModifier("noprogress");

    // var progress_bar = scriptCmdData.func.command.Progress;
    // // progress_bar.skip  = true; // does not make sense, individual files are processed very fast already
    // progress_bar.pause = true;
    // progress_bar.abort = true;
    // progress_bar.Init(scriptCmdData.func.sourcetab, 'Please wait'); 			// window title
    // progress_bar.SetStatus('Updating metadata info in ADS via MediaInfo CLI'); 	// header
    // progress_bar.Show();
    // progress_bar.SetFiles(scriptCmdData.func.sourcetab.selected_files.count);
    // progress_bar.Restart();

    // if (config.get('force_refresh_after_update')) { var orig_selected_items = scriptCmdData.func.sourcetab.selected; }

    // var selected_files_cnt = scriptCmdData.func.sourcetab.selstats.selfiles;
    // logger.verbose("Selected files count: " + selected_files_cnt);

    // fileloop: for (var e = new Enumerator(scriptCmdData.func.sourcetab.selected), cnt = 0; !e.atEnd(); e.moveNext(), cnt++) {
    //     var selected_item = e.item();
    //     if (selected_item.is_dir || selected_item.is_reparse || selected_item.is_junction || selected_item.is_symlink ) {
    //         logger.verbose('skipping ' + selected_item.name);
    //         continue;
    //     }
    //     logger.normal('Name: ' + selected_item.name);

    //     progress_bar.StepFiles(1);
    //     progress_bar.SetTitle(Global.SCRIPT_PREFIX + ' Update: ' + cnt + '/' + selected_files_cnt);
    //     progress_bar.SetName(selected_item.name);
    //     progress_bar.SetType('file');
    //     // progress_bar.EnableSkip(true, false);
    //     switch (progress_bar.GetAbortState()) {
    //     // case 's': progress_bar.ClearAbortState(); continue;
    //         case 'a': break fileloop;
    //         case 'p':
    //             while (progress_bar.GetAbortState() !== '') {
    //                 DOpus.Delay(200);
    //                 if (progress_bar.GetAbortState() === 'a') {
    //                     break fileloop;
    //                 }
    //             }
    //             break;
    //     }

    //     var json_contents = GetMediaInfoFor(selected_item);
    //     if (!json_contents) {
    //         logger.error('...no valid info received from MediaInfo');
    //         continue;
    //     }

    //     var mediainfo = JSON.parse(json_contents)['media'];
    //     logger.verbose('1st line: ' + mediainfo['@ref']);

    //     var out_obj = {
    //         'last_modify'	: new Date(selected_item.modify).valueOf(),
    //         'added_to_cache': 0 // this timestamp will be used to limit the number of items in cache
    //     };

    //     for (var i = 0; i < mediainfo['track'].length; i++) {
    //         var track = mediainfo['track'][i];
    //         logger.verbose('Track #' + i + ': ' + track['@type'] + ', ' + track['Format']);
    //         switch (track['@type']) {
    //             case 'General':
    //                 if (out_obj.container_format) break;	// read only 1st one
    //                 out_obj.container_format		= track['Format']							|| '';
    //                 out_obj.container_codec 		= track['CodecID']							|| '';
    //                 out_obj.container_enc_app		= track['Encoded_Application']				|| '';	// video does not have app, only container
    //                 out_obj.container_enc_lib		= track['Encoded_Library']					|| '';
    //                 out_obj.container_date_encoded	= track['Encoded_Date']				    	|| '';
    //                 out_obj.container_date_tagged	= track['Tagged_Date']				    	|| '';
    //                 out_obj.file_size 				= parseInt(track['FileSize'])				|| 0;
    //                 out_obj.duration				= parseFloat(track['Duration'])				|| 0;
    //                 out_obj.overall_bitrate			= parseInt(track['OverallBitRate'])			|| 0;
    //                 out_obj.overall_bitrate_mode	= track['OverallBitRate_Mode']				|| '';
    //                 out_obj.video_count 			= parseInt(track['VideoCount'])				|| 0;
    //                 out_obj.audio_count 			= parseInt(track['AudioCount'])				|| 0;
    //                 out_obj.text_count 				= parseInt(track['TextCount'])				|| 0;
    //                 out_obj.others_count 			= parseInt(track['MenuCount'])				|| 0;
    //                 out_obj.has_replay_gain			= (track['extra'] && (track['extra']['REPLAYGAIN_GAIN'] || track['extra']['replaygain_track_gain'] || track['extra']['replaygain_album_gain'] || track['extra']['R128_TRACK_GAIN'] || track['extra']['R128_ALBUM_GAIN'] )) ? 1 : 0;
    //                 out_obj.format_additional 		= track['Format_AdditionalFeatures']		|| '';
    //                 out_obj.extra					= track['extra'] 							|| '';

    //                 // if (track['extra']) {
    //                 // 	if (track['extra']['ENCODER_OPTIONS']) {
    //                 // 		// currently only for Opus files
    //                 // 		out_obj.audio_bitrate_mode 		= track['extra']['ENCODER_OPTIONS'].indexOf('--cvbr') >= 0 ? 'VBR' : out_obj.audio_bitrate_mode;
    //                 // 		out_obj.audio_bitrate_mode 		= track['extra']['ENCODER_OPTIONS'].indexOf('--cabr') >= 0 ? 'ABR' : out_obj.audio_bitrate_mode;
    //                 // 		out_obj.audio_bitrate_mode 		= track['extra']['ENCODER_OPTIONS'].indexOf('--ccbr') >= 0 ? 'CBR' : out_obj.audio_bitrate_mode;
    //                 // 		out_obj.audio_compression_mode 	= track['extra']['ENCODER_OPTIONS'].indexOf('--music') >= 0 ? 'Music' : out_obj.audio_compression_mode;
    //                 // 		out_obj.audio_compression_mode 	= track['extra']['ENCODER_OPTIONS'].indexOf('--speech') >= 0 ? 'Speech' : out_obj.audio_compression_mode;
    //                 // 	}
    //                 // 	// currently only for TS files - does not seem to be necessary and it's a very bad solution
    //                 // 	// if (out_obj.container_format === 'MPEG-TS' && track['extra']['OverallBitRate_Precision_Min'] && track['extra']['OverallBitRate_Precision_Max']) {
    //                 // 	// 	out_obj.audio_bitrate = Math.round( (track['extra']['OverallBitRate_Precision_Min'] + track['extra']['OverallBitRate_Precision_Max']) / 2*1000);
    //                 // 	// }
    //                 // 	// log.error("Min: " + track['extra']['OverallBitRate_Precision_Min'] + "\nMax: " + track['extra']['OverallBitRate_Precision_Max']);
    //                 // }
    //                 break;
    //             case 'Video':
    //                 if (out_obj.video_format) break;		// read only 1st video track
    //                 out_obj.video_format			= track['Format'] 							|| '';
    //                 out_obj.video_codec 			= track['CodecID']							|| '';
    //                 out_obj.video_duration			= parseFloat(track['Duration'])				|| out_obj.duration || 0;
    //                 out_obj.video_bitrate 			= parseInt(track['BitRate'])				|| parseInt(track['BitRate_Nominal']) || (track['extra'] && track['extra']['FromStats_BitRate']) || 0;
    //                 out_obj.video_width				= parseInt(track['Width'])					|| 0;
    //                 out_obj.video_height			= parseInt(track['Height'])					|| 0;
    //                 out_obj.video_framerate			= parseFloat(track['FrameRate'])			|| 0;
    //                 out_obj.video_framecount		= parseFloat(track['FrameCount'])			|| 0;
    //                 out_obj.video_display_AR		= parseFloat(track['DisplayAspectRatio'])	|| 0;
    //                 out_obj.video_compression_mode	= track['Compression_Mode']					|| '';
    //                 out_obj.video_format_additional = track['Format_AdditionalFeatures']		|| '';
    //                 out_obj.video_enc_lib			= track['Encoded_Library']					|| '';
    //                 out_obj.video_enc_libname		= track['Encoded_Library_Name']				|| '';
    //                 out_obj.video_stream_size		= parseInt(track['StreamSize'])				|| 0;
    //                 out_obj.video_extra				= track['extra'] 							|| '';
    //                 break;
    //             case 'Audio':
    //                 if (out_obj.audio_format) break;		// read only 1st audio track
    //                 out_obj.audio_format			= track['Format'] 							|| '';
    //                 out_obj.audio_codec 			= track['CodecID'] 							|| '';
    //                 out_obj.audio_language 			= track['Language'] 						|| 'und';
    //                 out_obj.audio_duration			= parseFloat(track['Duration'])				|| 0;
    //                 // out_obj.audio_bitrate 			= parseInt(track['BitRate'])				|| parseInt(track['extra'] && track['extra']['FromStats_BitRate']) || (out_obj.video_count === 0 ? out_obj.overall_bitrate : 0) || out_obj.audio_bitrate || 0;
    //                 out_obj.audio_bitrate 			= parseInt(track['BitRate'])				|| parseInt(track['extra'] && track['extra']['FromStats_BitRate']) || out_obj.audio_bitrate || 0;
    //                 out_obj.audio_format_version	= track['Format_Version'] 					|| '';
    //                 out_obj.audio_format_profile	= track['Format_Profile'] 					|| '';
    //                 out_obj.audio_format_set_mode	= track['Format_Settings_Mode'] 			|| '';
    //                 out_obj.audio_format_additional = track['Format_AdditionalFeatures']		|| '';
    //                 // out_obj.audio_bitrate_mode		= track['BitRate_Mode'] 					|| out_obj.audio_bitrate_mode || ( out_obj.audio_format === "Monkey's Audio" ? 'VBR' : '') || '';
    //                 out_obj.audio_bitrate_mode		= track['BitRate_Mode'] 					|| out_obj.audio_bitrate_mode || (config.get('formats_regex_vbr').test(out_obj.audio_format) && 'VBR') || '';
    //                 out_obj.audio_channels			= parseInt(track['Channels'])				|| 0;
    //                 out_obj.audio_bit_depth			= parseInt(track['BitDepth'])				|| 0;
    //                 out_obj.audio_sampling_rate		= parseInt(track['SamplingRate'])			|| 0;
    //                 // out_obj.audio_compression_mode  = track['Compression_Mode'] 				|| (config.get('formats_regex_lossless').test(out_obj.audio_format) && 'Lossless') || (config.get('formats_regex_lossy').test(out_obj.audio_format) && 'Lossy') || '';
    //                 // logger.error(out_obj.audio_format);
    //                 // logger.error(config.get('formats_regex_lossless'));
    //                 // logger.error(config.get('formats_regex_lossless').test(out_obj.audio_format));
    //                 out_obj.audio_compression_mode  = (config.get('formats_regex_lossless').test(out_obj.audio_format) && 'Lossless') || (config.get('formats_regex_lossy').test(out_obj.audio_format) && 'Lossy') || track['Compression_Mode']	|| '';
    //                 out_obj.audio_stream_size		= parseInt(track['StreamSize'])				|| 0;
    //                 out_obj.audio_extra				= track['extra'] 							|| '';

    //                 if (out_obj.audio_format === 'WMA' && track['Format_Profile'] === 'Lossless'){
    //                     out_obj.audio_compression_mode = 'Lossless';
    //                 }

    //                 out_obj.has_replay_gain 		= (out_obj.has_replay_gain || track['ReplayGain_Gain']) ? 1 : 0;	// RG can be stored on container level e.g. in M4A, MKA, or audio level, e.g. in MP3
    //                 break;
    //             case 'Text':
    //                 if (out_obj.text_codec) break;			// read only 1st subtitle track
    //                 out_obj.text_codec				= track['CodecID']  						|| '',
    //                 out_obj.text_title				= track['Title']	 						|| '';
    //                 out_obj.text_language			= track['Language'] 						|| '';
    //                 break;
    //             default:
    //             // add anything else than menus to the 'others'
    //             // optionally use track['extra'].length for a chapters count (may not be accurate, see MediaInfo dump first)
    //                 if (track['@type'] !== 'Menu') out_obj.others_count++;
    //         }
    //     }

    //     if (out_obj.audio_format === 'Opus') {
    //         // for Opus files
    //         if (out_obj.extra && out_obj.extra.ENCODER_OPTIONS) {
    //             logger.normal("Opus -- Encoder Options: " + out_obj.extra.ENCODER_OPTIONS);
    //             if (out_obj.extra.ENCODER_OPTIONS.indexOf('--cvbr') >= 0) {
    //                 out_obj.audio_bitrate_mode = 'VBR';
    //             } else if (out_obj.extra.ENCODER_OPTIONS.indexOf('--vbr') >= 0) {
    //                 out_obj.audio_bitrate_mode = 'VBR';
    //             } else if (out_obj.extra.ENCODER_OPTIONS.indexOf('--cabr') >= 0) {
    //                 out_obj.audio_bitrate_mode = 'VBR';
    //             } else if (out_obj.extra.ENCODER_OPTIONS.indexOf('--ccbr') >= 0) {
    //                 out_obj.audio_bitrate_mode = 'CBR';
    //             } else if (out_obj.extra.ENCODER_OPTIONS.indexOf('--hard-cbr') >= 0) {
    //                 out_obj.audio_bitrate_mode = 'CBR';
    //             }
    //             if (out_obj.extra.ENCODER_OPTIONS.indexOf('--music') >= 0) {
    //                 out_obj.audio_format_additional += 'Music';
    //             } else if (out_obj.extra.ENCODER_OPTIONS.indexOf('--speech') >= 0) {
    //                 out_obj.audio_format_additional += 'Speech';
    //             }
    //             logger.normal('Opus -- Determined BR mode: ' + out_obj.audio_bitrate_mode + "\nFormat Additional: " + out_obj.audio_format_additional);
    //         }

    //     }

    //     logger.verbose(JSON.stringify(out_obj));
    //     if (out_obj.video_count || out_obj.audio_count) {
    //         SaveMetadataADS(selected_item, out_obj);
    //     } else {
    //         logger.error(selected_item.name + ', skipping file - no video or audio stream found');
    //         continue fileloop;
    //     }
    // }

    // progress_bar.ClearAbortState();
    // progress_bar.Hide();

    // if (config.get('force_refresh_after_update')) {
    //     // refresh and re-select previously selected files
    //     // this seems to work for most of the time, but sometimes misses (?) few files if flat-folder view is used
    //     // not sure if it really misses files though
    //     util.cmdGlobal.RunCommand('Go Refresh');
    //     util.cmdGlobal.ClearFiles();
    //     for (var e = new Enumerator(orig_selected_items); !e.atEnd(); e.moveNext()) {
    //         util.cmdGlobal.AddFile(e.item());
    //     }
    //     util.cmdGlobal.RunCommand('Select FROMSCRIPT');
    // }
}


// DELETE METADATA
function OnME_Delete(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_Delete.fname = 'OnME_Delete';
    // if (!validateConfigAndShowResult(false, scriptCmdData.func.Dlg, true)) return;

    // scriptCmdData.func.command.SetModifier("noprogress");

    // if (config.get('force_refresh_after_update')) { var orig_selected_items = scriptCmdData.func.sourcetab.selected; }

    // var progress_bar = scriptCmdData.func.command.Progress;
    // // progress_bar.skip  = true; // does not make sense, individual files are processed very fast already
    // progress_bar.pause = true;
    // progress_bar.abort = true;
    // progress_bar.Init(scriptCmdData.func.sourcetab, 'Please wait'); // window title
    // progress_bar.SetStatus('Deleting metadata ADS'); 				// header
    // progress_bar.Show();
    // progress_bar.SetFiles(scriptCmdData.func.sourcetab.selected.count);
    // progress_bar.Restart();

    // var selected_files_cnt = scriptCmdData.func.sourcetab.selstats.selfiles;
    // logger.verbose("Selected files count: " + selected_files_cnt);

    // fileloop: for (var e = new Enumerator(scriptCmdData.func.sourcetab.selected), cnt = 0; !e.atEnd(); e.moveNext(), cnt++) {
    //     var selected_item = e.item();
    //     if (selected_item.is_dir || selected_item.is_reparse || selected_item.is_junction || selected_item.is_symlink ) {
    //         logger.verbose('skipping ' + selected_item.name);
    //         continue;
    //     }
    //     logger.normal('Name: ' + selected_item.name);

    //     progress_bar.StepFiles(1);
    //     progress_bar.SetTitle(Global.SCRIPT_PREFIX + ' Delete: ' + cnt + '/' + selected_files_cnt);
    //     progress_bar.SetName(selected_item.name);
    //     progress_bar.SetType('file');
    //     // progress_bar.EnableSkip(true, false);
    //     switch (progress_bar.GetAbortState()) {
    //     // case 's': progress_bar.ClearAbortState(); continue;
    //         case 'a': break fileloop;
    //         case 'p':
    //             while (progress_bar.GetAbortState() !== '') {
    //                 DOpus.Delay(200);
    //                 if (progress_bar.GetAbortState() === 'a') {
    //                     break fileloop;
    //                 }
    //             }
    //             break;
    //     }

    //     DeleteMetadataADS(selected_item);
    // }
    // if (config.get('force_refresh_after_update')) {
    //     // refresh and re-select previously selected files
    //     // this seems to work for most of the time, but sometimes misses (?) few files if flat-folder view is used
    //     // not sure if it really misses files though
    //     util.cmdGlobal.RunCommand('Go Refresh');
    //     util.cmdGlobal.ClearFiles();
    //     for (var e = new Enumerator(orig_selected_items); !e.atEnd(); e.moveNext()) {
    //         util.cmdGlobal.AddFile(e.item());
    //     }
    //     util.cmdGlobal.RunCommand('Select FROMSCRIPT');
    // }
    // progress_bar.ClearAbortState();
    // progress_bar.Hide();
    // DumpCache('OnME_Delete', 2);
}


// CLEAR CACHE
function OnME_ClearCache() {
    const fname = OnME_ClearCache.fname = 'OnME_ClearCache';
    // util.sv.set('cache', DOpus.Create.Map());
    // logger.force('Cache cleared');
}


// DUMP ADS METADATA
function OnME_ADSDump(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_ADSDump.fname = 'OnME_ADSDump';
    // if (!validateConfigAndShowResult(false, scriptCmdData.func.Dlg, true)) return;
    // DOpus.Output("\n\n\n\n\n");
    // logger.force(GetMetadataForAllSelectedFiles(scriptCmdData));
    // DOpus.Output("\n\n\n\n\n");
}


// COPY ADS METADATA
function OnME_ADSCopy(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_ADSCopy.fname = 'OnME_ADSCopy';
    // if (!validateConfigAndShowResult(false, scriptCmdData.func.Dlg, true)) return;
    // util.cmdGlobal.RunCommand('Clipboard SET ' + GetMetadataForAllSelectedFiles(scriptCmdData));
    // logger.force('Copied ADS metadata for selected files to clipboard');
}


// DUMP MEDIAINFO OUTPUT
function OnME_MediaInfoDump(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_MediaInfoDump.fname = 'OnME_MediaInfoDump';
    // if (!validateConfigAndShowResult(false, scriptCmdData.func.Dlg, true)) return;
    // DOpus.Output("\n\n\n\n\n");
    // logger.force(GetMediaInfoForAllSelectedFiles(scriptCmdData));
    // DOpus.Output("\n\n\n\n\n");
}


// COPY MEDIAINFO OUTPUT
function OnME_MediaInfoCopy(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_MediaInfoCopy.fname = 'OnME_MediaInfoCopy';
    // if (!validateConfigAndShowResult(false, scriptCmdData.func.Dlg, true)) return;
    // util.cmdGlobal.RunCommand('Clipboard SET ' + GetMediaInfoForAllSelectedFiles(scriptCmdData));
    // logger.force('Copied MediaInfo output for selected files to clipboard');
}



// ESTIMATE BITRATES
function OnME_EstimateBitrates(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_EstimateBitrates.fname = 'OnME_EstimateBitrates';
    // if (!validateConfigAndShowResult(false, scriptCmdData.func.Dlg, true)) return;

    // var target_bitsperpixel_values = [
    //     0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 50
    // ];
    // var out_obj = {};
    // for (var e = new Enumerator(scriptCmdData.func.sourcetab.selected); !e.atEnd(); e.moveNext()) {
    //     var selected_item = e.item();
    //     if (selected_item.is_dir || selected_item.is_reparse || selected_item.is_junction || selected_item.is_symlink ) {
    //         logger.verbose('skipping ' + selected_item.name);
    //         continue;
    //     }
    //     var item_props = ReadMetadataADS(selected_item);
    //     out_obj[selected_item.realpath] = [];
    //     for (var i = 0; i < target_bitsperpixel_values.length; i++) {
    //         var current_target_value = target_bitsperpixel_values[i];
    //         var estimated_target_bitrate = Math.round(current_target_value * item_props.video_width * item_props.video_height / (1024)) + ' kbps';
    //         out_obj[selected_item.realpath].push( { 'target_bitsperpixel': current_target_value, 'estimated kbps': estimated_target_bitrate } );
    //     }
    // }
    // DOpus.Output(JSON.stringify(out_obj, null, 4));
}

// TOGGLE ESSENTIAL COLUMNS
function OnME_ToggleEssentialColumns(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_ToggleEssentialColumns.fname = 'OnME_ToggleEssentialColumns';
    // if (!validateConfigAndShowResult(false, scriptCmdData.func.Dlg, true)) return;
    // _toggleColumnGroup('essential', config.get('fields_essential'), config.get('fields_essential_after'));
}
// TOGGLE OPTIONAL COLUMNS
function OnME_ToggleOptionalColumns(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_ToggleOptionalColumns.fname = 'OnME_ToggleOptionalColumns';
    // if (!validateConfigAndShowResult(false, scriptCmdData.func.Dlg, true)) return;
    // _toggleColumnGroup('optional', config.get('fields_optional'), config.get('fields_optional_after'));
}
// TOGGLE OTHER COLUMNS
function OnME_ToggleOtherColumns(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_ToggleOtherColumns.fname = 'OnME_ToggleOtherColumns';
    // if (!validateConfigAndShowResult(false, scriptCmdData.func.Dlg, true)) return;
    // _toggleColumnGroup('other', config.get('fields_other'), config.get('fields_other_after'));
}
// TOGGLE VERBOSE COLUMNS
function OnME_ToggleVerboseColumns(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_ToggleVerboseColumns.fname = 'OnME_ToggleVerboseColumns';
    // if (!validateConfigAndShowResult(false, scriptCmdData.func.Dlg, true)) return;
    // _toggleColumnGroup('verbose', config.get('fields_verbose'), config.get('fields_verbose_after'));
}
// internal method called by OnME_ToggleXXXColumns
function _toggleColumnGroup(groupName: string, columnsArray: string[], columnAfter: string) {
    const fname = _toggleColumnGroup.fname = '_toggleColumnGroup';
    // var col_after = columnAfter.indexOf('MExt_') === 0 ? 'scp:' + Global.SCRIPT_NAME + '/' + columnAfter : columnAfter;
    // var refresh;
    // util.cmdGlobal.clearFiles();
    // for (var i = 0; i < columnsArray.length; i++) {
    //     var item = columnsArray[i];
    //     refresh = false;
    //     if (item.indexOf('MExt_') >= 0) {
    //         item = 'scp:' + Global.SCRIPT_NAME + '/' + item;
    //         refresh = true;
    //     }
    //     logger.info('Toggling col: ' + item);
    //     cmd = 'Set COLUMNSTOGGLE=' + item + '(!' + (i+1) + '+' +  col_after + ',*)'; // * is for auto-size
    //     logger.verbose('_toggleColumnGroup -- (' + groupName + '):   ' + cmd);
    //     util.cmdGlobal.addLine(cmd);
    // }
    // util.cmdGlobal.run();
    // util.cmdGlobal.clear();
    // if (refresh) {
    //     // TODO - recheck if this is necessary
    //     // Script.RefreshColumn(columnsArray[i]);
    // }
}



// DEVELOPER HELPER METHOD
function OnME_TestMethod1(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_TestMethod1.fname = 'OnME_TestMethod1';
    // // unit tests for the poor
    // var oldErrorMode = config.getErrorMode();

    // DOpus.Output('OnME_TestMethod1 -- Adding valid values - started');
    // config.setErrorMode(config.modes.ERROR);
    // config.addBoolean('a', false);										DOpus.Output('\ttype: ' + config.getType('a'));
    // config.addString('b', "hello world");								DOpus.Output('\ttype: ' + config.getType('b'));
    // config.addNumber('c', 1);											DOpus.Output('\ttype: ' + config.getType('c'));
    // config.addPath('d', '%gvdTool%\\MMedia\\MediaInfo\\MediaInfo.exe');	DOpus.Output('\ttype: ' + config.getType('d'));
    // config.addArray('e', [ 'a', 1 ]);									DOpus.Output('\ttype: ' + config.getType('e'));
    // config.addPOJO('f', { 'a': 1 });									DOpus.Output('\ttype: ' + config.getType('f'));
    // config.addObject('g', { 'a': 1, fn: function(){} });				DOpus.Output('\ttype: ' + config.getType('g'));
    // config.addRegexp('h', new RegExp(/foo.+bar/));						DOpus.Output('\ttype: ' + config.getType('h'));
    // config.addJSON('i', '{ "a": 1 }');									DOpus.Output('\ttype: ' + config.getType('i'));
    // config.addFunction('j', function(){});								DOpus.Output('\ttype: ' + config.getType('j'));
    // config.setErrorMode(oldErrorMode);
    // DOpus.Output('OnME_TestMethod1 -- Adding valid values - finished');

    // DOpus.Output('');
    // DOpus.Output('');
    // DOpus.Output('');
    // DOpus.Output('');

    // DOpus.Output('OnME_TestMethod1 -- Adding invalid values - started');
    // config.setErrorMode(config.modes.NONE);
    // var res;
    // res = config.addJSON('a', "{ 'a': 1 }");							DOpus.Output('\tresult: ' + res); // causes an error, JSON may not use single quotes
    // res = config.addNumber('b', false);									DOpus.Output('\tresult: ' + res); // value not matching given type
    // res = config.addNumber('c', "hello world");							DOpus.Output('\tresult: ' + res); // value not matching given type
    // res = config.addString('d', 1);										DOpus.Output('\tresult: ' + res); // value not matching given type
    // res = config.addPath('e', 'MediaInfo.exe');							DOpus.Output('\tresult: ' + res); // value not matching given type
    // res = config.addJSON('f', [ 'a', 1 ]);								DOpus.Output('\tresult: ' + res); // value not matching given type
    // res = config.addArray('g', { 'a': 1 });								DOpus.Output('\tresult: ' + res); // value not matching given type
    // res = config.addPOJO('h', {"a":1,fn:function(){}});					DOpus.Output('\tresult: ' + res); // value not matching given type
    // res = config.addObject('i', '{ "a": 1');							DOpus.Output('\tresult: ' + res); // value not matching given type
    // res = config.addString('j', function(){var x= 1});					DOpus.Output('\tresult: ' + res); // value not matching given type
    // config.setErrorMode(oldErrorMode);
    // DOpus.Output('OnME_TestMethod1 -- Adding invalid values - finished');

    // DOpus.Output('');
    // DOpus.Output('');
    // DOpus.Output('');
    // DOpus.Output('');



    // DOpus.Output('OnME_TestMethod1 -- Testing error modes - started');
    // var oldLoggerLevel = logger.getLevel();

    // logger.force("Current error level: " + logger.getLevel());
    // logger.error("This is a sample message in level: "   + "ERROR");
    // logger.warn("This is a sample message in level: "    + "WARN");
    // logger.normal("This is a sample message in level: "  + "NORMAL");
    // logger.info("This is a sample message in level: "    + "INFO");
    // logger.verbose("This is a sample message in level: " + "VERBOSE");

    // DOpus.Output('');

    // logger.setLevel(logger.levels.NONE);
    // logger.force("Current error level: " + logger.getLevel());
    // logger.error("This is a sample message in level: "   + "ERROR");
    // logger.warn("This is a sample message in level: "    + "WARN");
    // logger.normal("This is a sample message in level: "  + "NORMAL");
    // logger.info("This is a sample message in level: "    + "INFO");
    // logger.verbose("This is a sample message in level: " + "VERBOSE");

    // DOpus.Output('');

    // logger.setLevel(logger.levels.ERROR);
    // logger.force("Current error level: " + logger.getLevel());
    // logger.error("This is a sample message in level: "   + "ERROR");
    // logger.warn("This is a sample message in level: "    + "WARN");
    // logger.normal("This is a sample message in level: "  + "NORMAL");
    // logger.info("This is a sample message in level: "    + "INFO");
    // logger.verbose("This is a sample message in level: " + "VERBOSE");

    // DOpus.Output('');

    // logger.setLevel(logger.levels.WARN);
    // logger.force("Current error level: " + logger.getLevel());
    // logger.error("This is a sample message in level: "   + "ERROR");
    // logger.warn("This is a sample message in level: "    + "WARN");
    // logger.normal("This is a sample message in level: "  + "NORMAL");
    // logger.info("This is a sample message in level: "    + "INFO");
    // logger.verbose("This is a sample message in level: " + "VERBOSE");

    // DOpus.Output('');

    // logger.setLevel(logger.levels.NORMAL);
    // logger.force("Current error level: " + logger.getLevel());
    // logger.error("This is a sample message in level: "   + "ERROR");
    // logger.warn("This is a sample message in level: "    + "WARN");
    // logger.normal("This is a sample message in level: "  + "NORMAL");
    // logger.info("This is a sample message in level: "    + "INFO");
    // logger.verbose("This is a sample message in level: " + "VERBOSE");

    // DOpus.Output('');

    // logger.setLevel(logger.levels.INFO);
    // logger.force("Current error level: " + logger.getLevel());
    // logger.error("This is a sample message in level: "   + "ERROR");
    // logger.warn("This is a sample message in level: "    + "WARN");
    // logger.normal("This is a sample message in level: "  + "NORMAL");
    // logger.info("This is a sample message in level: "    + "INFO");
    // logger.verbose("This is a sample message in level: " + "VERBOSE");

    // DOpus.Output('');

    // logger.setLevel(logger.levels.VERBOSE);
    // logger.force("Current error level: " + logger.getLevel());
    // logger.error("This is a sample message in level: "   + "ERROR");
    // logger.warn("This is a sample message in level: "    + "WARN");
    // logger.normal("This is a sample message in level: "  + "NORMAL");
    // logger.info("This is a sample message in level: "    + "INFO");
    // logger.verbose("This is a sample message in level: " + "VERBOSE");

    // logger.setLevel(oldLoggerLevel);
    // DOpus.Output('OnME_TestMethod1 -- Testing error modes - finished');
}


// DEVELOPER HELPER METHOD
function OnME_TestMethod2(scriptCmdData: DOpusScriptCommandData) {
    const fname = OnME_TestMethod2.fname = 'OnME_TestMethod2';
    // DOpus.ClearOutput();
    // // validateConfigAndShowResult(true, scriptCmdData.func.Dlg, false, true);
}



/*
           d8888 888     888 88888888888  .d88888b.         8888888b.  8888888888 8888888 888b    888 8888888 88888888888
          d88888 888     888     888     d88P" "Y88b        888   Y88b 888          888   8888b   888   888       888
         d88P888 888     888     888     888     888        888    888 888          888   88888b  888   888       888
        d88P 888 888     888     888     888     888        888   d88P 8888888      888   888Y88b 888   888       888
       d88P  888 888     888     888     888     888        8888888P"  888          888   888 Y88b888   888       888
      d88P   888 888     888     888     888     888 888888 888 T88b   888          888   888  Y88888   888       888
     d8888888888 Y88b. .d88P     888     Y88b. .d88P        888  T88b  888          888   888   Y8888   888       888
    d88P     888  "Y88888P"      888      "Y88888P"         888   T88b 8888888888 8888888 888    Y888 8888888     888
*/
// auto-initalize global vars every time the script is run
if (typeof Script !== 'undefined' && typeof Script.vars !== 'undefined') {
    _reinitGlobalVars();
}
// DOpus.output('<b>Script parsing finished</b>');






/*
function hashTest(cmdData: DOpusScriptCommandData) {
    // var selCount = cmdData.func.sourceTab.selstats.files;
    // var vec      = DOpus.create().vector(selCount);
    var vec      = DOpus.create().vector();
    var mapLong  = DOpus.create().map();
    var mapShort = DOpus.create().map();


    for (const ev = new Enumerator(cmdData.func.sourceTab.selected); !ev.atEnd(); ev.moveNext()) {
        vec.push_back(ev.item());
    }



    DOpus.output(sw.start('long strings').print());
    for (const ev1 = new Enumerator(vec); !ev1.atEnd(); ev1.moveNext()) {
        const im1: DOpusItem = ev1.item();
        mapLong.set(im1.realpath, g.now());
    }
    DOpus.output(sw.getElapsed('long strings').print());
    for (const em1 = new Enumerator(mapLong); !em1.atEnd(); em1.moveNext()) {
        const im1: string = em1.item();
        // DOpus.output(im1 + ': ' + mapLong.get(im1));
    }
    DOpus.output(sw.stop('long strings').print());


    // var blob = DOpus.create().blob();
    // blob.copyFrom('' + _now + Math.floor(1000000000 + Math.random() * 8999999999));
    // var _nowMD5 = DOpus.fsUtil().hash(blob, 'md5');

    var blob = DOpus.create().blob();
    DOpus.output(sw.start('md5 strings').print());
    for (const ev2 = new Enumerator(vec); !ev2.atEnd(); ev2.moveNext()) {
        const im2: DOpusItem = ev2.item();
        blob.copyFrom('' + im2.realpath);
        mapShort.set(DOpus.fsUtil().hash(blob, 'crc32'), g.now());
    }
    DOpus.output(sw.getElapsed('md5 strings').print());
    for (const em2 = new Enumerator(mapShort); !em2.atEnd(); em2.moveNext()) {
        const im2: string = em2.item();
        // DOpus.output(im2 + ': ' + mapShort.get(im2));
    }
    DOpus.output(sw.stop('md5 strings').print());
}
*/
