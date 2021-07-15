Containers && Codecs tested so far:

MKV, MP4, AVI, FLV, WEBM, 3GP,
M4A, M4B, MKA, MP3, MP2, MP1, FLAC, AC3, AAC, DTS, TrueHD (Dolby Atmos),
Wave, Wave64, ALAC, TAK, TTA, DSD, Ogg Vorbis, AIFF, AMR, WavPack, WMA Lossy & Lossless, MusePack

....and any file as long as MediaInfo reports at least a video or audio track.

This means:
1.	To process multiple files you can select whatever you want, not just video or audio files,
    and any file which does not have at least 1 video or audio track will be skipped and no ADS data will be stored.
    However, you might want to select less files to avoid unnecessary probing into the non-multimedia files.
2.	You can customize the output for any format I forgot or new formats recognized by MediaInfo.
    If format and/or codec information is shown, the displayed string can be customized arbitrarily WITHOUT reprocessing files.

A full list can be found @ https://mediaarea.net/en/MediaInfo/Support/Formats

Not processed by definition:
    Directories, reparse points, junctions, symlinks

Some file types are better supported than others,
e.g. RG can be saved in WAVs (by Foobar2000) but not recognized by MediaInfo.
