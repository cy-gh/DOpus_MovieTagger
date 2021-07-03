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
///<reference path='./libs/libURLHelpers.ts' />
///<reference path='./libs/libFS.ts' />
///<reference path='./libs/libConfigAccess.ts' />

// use CTRL-SHIFT-B to build - you must have npx.cmd in your path



namespace config {
    export enum TYPE {
        PHONENUM = 'PHONENUM'
    }
    const isValidOrig = user.isValid;
    user.isValid = function (val: any, type: config.TYPE) {
        switch(type) {
            case config.TYPE.PHONENUM:
                DOpus.output('running extended method');
                var rePN = /^\d{3}-[\d\-]+$/; // or whatever format you use
                return rePN.test(val);
            default:
                return isValidOrig(val, type);
        }
    }
    // user.isValid = isValidExt;
}





// // internal method called by OnInit()
// function addToConfigVar(initData: DOpusScriptInitData, group: string, name: string, desc: string, value: any) {
//     var cfg                     = cfg.getBinding(name);;
//     initData.config[cfg]        = value || cfg.get(name);
//     // initData.config_desc(cfg)    = desc;
//     // initData.config_groups(cfg)    = group;
//     initData.config_desc.set(cfg, desc);
//     initData.config_groups.set(cfg, group);
// }


// temporary vars

type globalType = {
    [k: string]: any
}
var logger = libLogger.logger;
var Global:globalType = {};
Global['SCRIPT_NAME'] = 'cuMovieTagger';
var cfg = config.user;
var ext = config.ext;

function setupConfigVars(initData: DOpusScriptInitData)
// CONFIG - DEFAULT VALUES
{

    cfg.setInitData(initData);

    cfg.addNumber(
        'DEBUG_LEVEL',
        logger.getLevel(),
        'DEBUG_LEVEL',
        'TEST GROUP',
        'How much information should be put to DOpus output window - Beware of anything above & incl. NORMAL, it might crash your DOpus!\nSome crucial messages or commands like Dump ADS, Dump MediaInfo, Estimate Bitrate are not affected'
        );

    /**
     * Name of the ADS stream, can be also used via "dir /:" or "type file:stream_name" commands
     *
     * ADJUST AS YOU SEE FIT
     *
     * WARNING:
     * Make sure you use a long-term name for this stream.
     * If you want to rename this after having processed some files,
     * you should REMOVE all existing streams first (by calling the Remove command) before processing any file
     * otherwise those streams will not be processed by this script and become orphans,
     * and an army of thousands ghosts will haunt you for the rest of your life, you wouldn't like that mess
     *
     */
    cfg.addString('MetaStreamName', 'MExt_MediaInfo', 'META_STREAM_NAME');


    /**
     * path to MediaInfo.exe, portable/CLI version can be downloaded from https://mediaarea.net/en/MediaInfo
     *
     * ADJUST AS YOU SEE FIT
     *
     * you need only the .exe file, no templates or alike are necessary as we use only built-in JSON output
     */
    // config.addPath('mediainfo_path', '%gvdTool%\\MMedia\\MediaInfo\\MediaInfoXXX.exe', 'MEDIAINFO_PATH');
    // do not use addPath() but use addValueWithBinding() with bypass=true - otherwise people will get an error on initial installation
    cfg.addValueWithBinding('mediainfo_path', '%gvdTool%\\MMedia\\MediaInfo\\MediaInfo.exe', config.TYPE.PATH, 'MEDIAINFO_PATH', undefined, undefined, true);
    // config.addString('ref_mediainfo_download_url', 'https://mediaarea.net/en/MediaInfo/Download/Windows', 'REF_MEDIAINFO_DOWNLOAD_URL');

    /**
     * keep the original "last modified timestamp" after updating/deleting ADS; TRUE highly recommended
     *
     * ADJUST AS YOU SEE FIT
     */
    cfg.addBoolean('keep_orig_modts', true, 'KEEP_ORIG_MODTS');

    /**
     * auto refresh lister after updating metadata
     *
     * ADJUST AS YOU SEE FIT
     *
     * please keep in mind, auto-refresh is not an automatic win
     * if you select a single in big folder, the whole folder must be refreshed,
     * i.e. all activated columns for all files need to be re-read
     * which might be slow depending on your config and longer than you might have intended
     *
     * however, also keep in mind the read time per size DOES NOT DEPEND ON THE FILE SIZE
     * the refresh time is relational to the NUMBER OF FILES and speed of your hdd/sdd/nvme/ramdisk/potato
     */
    cfg.addBoolean('force_refresh_after_update', true, 'FORCE_REFRESH_AFTER_UPDATE');

    /**
     * cache metadata JS objects in memory for unchanged files to speed up process (the gain remains questionable IMO)
     *
     * ADJUST AS YOU SEE FIT
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
    cfg.addBoolean('cache_enabled', true, 'CACHE_ENABLED');


    // get list of all columns with ^\s+col(?!\.name).+$\n in a decent editor
    var fields_base_reference, fields_essential = [], fields_optional = [], fields_verbose = [], fields_other = [];
    // fields_base_reference = {
    // fields_base_reference = function(){return{
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

        "MExt_HelperContainer"            : "other",
        "MExt_HelperVideoCodec"           : "other",
        "MExt_HelperAudioCodec"           : "other",
        "MExt_CleanedUpName"              : "other",

        "MExt_ADSDataFormatted"           : "verbose",
        "MExt_ADSDataRaw"                 : "verbose"
    }`;
    cfg.addString('fields_base_reference', fields_base_reference.normalizeLeadingWhiteSpace(), 'REF_ALL_AVAILABLE_FIELDS');

    fields_base_reference = JSON.parse(fields_base_reference);
    for (var f in fields_base_reference) {
        switch(fields_base_reference[f]) {
            case 'essential': fields_essential.push(f); break;
            case 'optional':  fields_optional.push(f); break;
            case 'other':     fields_other.push(f); break;
            case 'verbose':   fields_verbose.push(f); break;
        }
    };
    cfg.addArray('fields_essential', fields_essential, 'TOGGLEABLE_FIELDS_ESSENTIAL');
    cfg.addArray('fields_optional', fields_optional, 'TOGGLEABLE_FIELDS_OPTIONAL');
    cfg.addArray('fields_other', fields_other, 'TOGGLEABLE_FIELDS_OTHER');
    cfg.addArray('fields_verbose', fields_verbose, 'TOGGLEABLE_FIELDS_VERBOSE');

    cfg.addString('fields_essential_after', 'Comments', 'TOGGLEABLE_FIELDS_ESSENTIAL_AFTER');
    cfg.addString('fields_optional_after', 'MExt_SubtitleLang', 'TOGGLEABLE_FIELDS_OPTIONAL_AFTER');
    cfg.addString('fields_other_after', '', 'TOGGLEABLE_FIELDS_OTHER_AFTER');
    cfg.addString('fields_verbose_after', '', 'TOGGLEABLE_FIELDS_VERBOSE_AFTER');


    /**
     * video resolution translation hash
     *
     * use SD, HD-Ready, HD, UHD, 4K, 8K, etc. if you like
     *
     * ADJUST AS YOU SEE FIT
     */
    // var lookup_resolutions = function(){return{
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
    JSON.stringify(JSON.parse(lookup_resolutions)); // test parseability on script load, do not remove
    cfg.addString('ref_lookup_resolutions', lookup_resolutions.normalizeLeadingWhiteSpace(), 'REF_LOOKUP_RESOLUTIONS');
    cfg.addPOJO('lookup_resolutions', JSON.parse(lookup_resolutions), 'LOOKUP_RESOLUTIONS');


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
    JSON.stringify(JSON.parse(lookup_duration_groups)); // test parseability on script load, do not remove
    cfg.addString('ref_lookup_duration_groups', lookup_duration_groups.normalizeLeadingWhiteSpace(), 'REF_LOOKUP_DURATION_GROUPS');
    cfg.addPOJO('lookup_duration_groups', JSON.parse(lookup_duration_groups), 'LOOKUP_DURATION_GROUPS');

    /**
     * video & audio codecs translation hash
     *
     * ADJUST AS YOU SEE FIT
     *
     * you might have to experiment a little bit to have the output suitable for your needs
     * I've tried to keep them as close to DOpus as possible, but concerning how wild the MPEG specs are
     * and how different encoders encode the videos, muxers set FourCC codes and other metainfo
     * you might not always see what you see in another program, e.g. AviDemux might show it as DIVX and another program as MP42, etc.
     */
    // var lookup_codecs = function(){return{
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
        "MPEG-4 VISUAL-DIV3"                                     : "DivX",
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
    // }.toString().slice(17, -3);
    JSON.stringify(JSON.parse(lookup_codecs)); // test parseability on script load, do not remove
    cfg.addString('ref_lookup_codecs', lookup_codecs.normalizeLeadingWhiteSpace(), 'REF_LOOKUP_CODECS');
    cfg.addPOJO('lookup_codecs', JSON.parse(lookup_codecs), 'LOOKUP_CODECS');

    /**
     * use short variants of codecs, found via LOOKUP_CODECS
     *
     * ADJUST AS YOU SEE FIT
     */
    cfg.addBoolean('codec_use_short_variant', false, 'CODEC_USE_SHORT_VARIANT');

    /**
     * add container or codec-specific information to the container/video/audio codec fields automatically
     * e.g. if an AAC file is encoded with 'LC SBR' it is shown as 'AAC (LC SPR)'
     *
     * ADJUST AS YOU SEE FIT
     */
    cfg.addBoolean('codec_append_addinfo', true, 'CODEC_APPEND_ADDINFO');

    /**
     * append '(Vertical)' to video resolutions
     *
     * ADJUST AS YOU SEE FIT
     */
    cfg.addBoolean('resolution_append_vertical', true, 'RESOLUTION_APPEND_VERTICAL');

    /**
     * Audio formats which do not store a VBR/CBR/ABR information separately but are VBR by definition
     *
     * do not touch
     */
    cfg.addRegexp('formats_regex_vbr', new RegExp(/ALAC|Monkey's Audio|TAK|DSD/), 'FORMATS_REGEX_VBR');

    /**
     * Audio formats which do not store a lossy/lossless information separately but are lossless by definition
     *
     * do not touch
     */
    cfg.addRegexp('formats_regex_lossless', new RegExp(/ALAC|PCM|TTA|DSD/), 'FORMATS_REGEX_LOSSLESS');
    cfg.addRegexp('formats_regex_lossy', new RegExp(/AMR/), 'FORMATS_REGEX_LOSSY');

    /**
     * audio channels translation hash
     *
     * ADJUST AS YOU SEE FIT
     */
    // var lookup_channels = function(){return{
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
    // }.toString().slice(17, -3);
    JSON.stringify(JSON.parse(lookup_channels)); // test parseability on script load, do not remove
    cfg.addString('ref_lookup_channels', lookup_channels.normalizeLeadingWhiteSpace(), 'REF_LOOKUP_CHANNELS');
    cfg.addPOJO('lookup_channels', JSON.parse(lookup_channels), 'LOOKUP_CHANNELS');

    /**
     * directory in which temporary files (selected_files_name.JSON) are created
     *
     * ADJUST AS YOU SEE FIT
     *
     * NO trailing slashes & backslashes must be 'escaped', i.e. C:\MyTempDir\SubDir\ --> should be put as C:\\MyTempDir\\SubDir
     *
     * can include environment variables
     */
    cfg.addPath('temp_files_dir', '%TEMP%', 'TEMP_FILES_DIR');

    /**
     * external configuration file to adjust column headers
     *
     * ADJUST AS YOU SEE FIT
     */
    var config_file_dir_raw = '/dopusdata\\Script AddIns';
    var config_file_dir_resolved = DOpus.fsUtil().resolve(config_file_dir_raw) + '\\';
    var config_file_name = Global.SCRIPT_NAME + '.json';
    // var config_file_contents = function(){return{
    var config_file_contents = `
    {
        // To customize the column headers
        // create a file with the name: ${config_file_name}
        // under: ${config_file_dir_raw}
        // (usually: ${config_file_dir_resolved})
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
        // note all internal column names start with: ${Global.SCRIPT_PREFIX}
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
    }`
    // }.toString().slice(17, -3)
    .substituteVars();
    JSON.stringify(JSON.parse(config_file_contents)); // test parseability on script load, do not remove
    cfg.addString('ref_config_file', config_file_contents.normalizeLeadingWhiteSpace(), 'REF_CONFIG_FILE');




    /**
     * name cleanup array
     *
     * use SD, HD-Ready, HD, UHD, 4K, 8K, etc. if you like
     *
     * ADJUST AS YOU SEE FIT
     */
    // var name_cleanup = function(){return{
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
    // }.toString().slice(17, -3);
    JSON.stringify(JSON.parse(name_cleanup)); // test parseability on script load, do not remove
    cfg.addString('ref_name_cleanup', name_cleanup.normalizeLeadingWhiteSpace(), 'REF_NAME_CLEANUP');
    cfg.addPOJO('name_cleanup', JSON.parse(name_cleanup), 'NAME_CLEANUP');



    // bindings for these 2 are unnecessary and ignored
    cfg.addString('config_file_dir_resolved', config_file_dir_resolved, '');
    cfg.addString('config_file_name', config_file_name, '');



config

    // do not touch this!
    // ext.setInitData(initData).addPOJO('ext_config_pojo');


    cfg.finalize();
    // ext.finalize();

}



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
    // var d = new Date('2021-06-28 T18:09:04.206Z');
    // // var d1 = doh.dc.date('D2021-06-28 T18:09:04');
    // // var d2 = doh.dc.date('2021-06-28 T18:09:04.206Z');
    // // var d3 = doh.dc.date(d.getTime());
    // var d1 = doh.dc.date(id);
    // var d2 = doh.dc.date(new Date());
    // var d3 = doh.dc.date(new Date().valueOf());

    // logger.sforce('d1: ' + d1);
    // logger.sforce('d2: ' + d2);
    // logger.sforce('d3: ' + d3);
    // logger.sforce('d1: ' + d1 + '\t' + d1.format('D#yyyy-MM-dd T#HH:mm:ss'));
    // logger.sforce('d2: ' + d2 + '\t' + d2.format('D#yyyy-MM-dd T#HH:mm:ss'));
    // logger.sforce('d3: ' + d3 + '\t' + d3.format('D#yyyy-MM-dd T#HH:mm:ss'));

    // DOpus.output('myname: ' + g.funcNameExtractor(OnInit));
    // DOpus.output('unique simple: ' + g.getUniqueID());
    // DOpus.output('unique non-simple: ' + g.getUniqueID(false));
    // DOpus.output(libSprintfjs.sprintf('%s: %d', 'prefix', 12))
    // try {
    //     throw new exc.NotImplementedYetException('this is the message', 'OnInit');
    // } catch(e) {
    //     DOpus.output(JSON.stringify(e, null, 4));
    // }

    // let adsStream = new ads.Stream('SHA1');
    // DOpus.output(adsStream.hasHashStream(doh.getItem('Y:\\simple.txt')));
    // var res = urlTools.getFromURLRaw('https://avatars.githubusercontent.com/u/71272476?v=4');
    // fs.saveFile('Y:\\cyghss.png', (<IDownloadedFile>res.ok).content);

    DOpus.output('pn: ' + config.TYPE.PHONENUM);
    DOpus.output('pn: ' + config.TYPE[config.TYPE.PHONENUM]);
    DOpus.output(config.user.isValid('123-456', config.TYPE.PHONENUM).toString());
    DOpus.output(config.user.isValid('123-456', config.TYPE.STRING).toString());



    // config.user.setInitData(initData);
    // DOpus.output('setupConfigVars: ' + initData.file);

    // config.user.addNumber(
    //     'DEBUG_LEVEL',
    //     logger.getLevel(),
    //     'DEBUG_LEVEL',
    //     'TEST GROUP',
    //     'How much information should be put to DOpus output window - Beware of anything above & incl. NORMAL, it might crash your DOpus!\nSome crucial messages or commands like Dump ADS, Dump MediaInfo, Estimate Bitrate are not affected'
    //     );

    // config.user.setInitData(initData);

    // config.user.addNumber(
    //     'DEBUG_LEVEL2',
    //     logger.getLevel(),
    //     'DEBUG_LEVEL2',
    //     'TEST GROUP',
    //     'How much information should be put to DOpus output window - Beware of anything above & incl. NORMAL, it might crash your DOpus!\nSome crucial messages or commands like Dump ADS, Dump MediaInfo, Estimate Bitrate are not affected'
    //     );

    setupConfigVars(initData);

    // config.user.addString('test', 'this is the default value', 'TEST_FOR_DOPUS');

    // DOpus.output(sprintfjs.sprintf(
    //     'name: %s, type: %s, binding: %s',
    //     'test',
    //     config.user.getValue('test'),
    //     config.user.getBinding('test')
    // ));


    enum foo {
        bar = 'barString',
        baz = 'bazString'
    }
    DOpus.output('test: ' + foo['bar']);

    DOpus.output('script finished');

}
