# Supported Container Formats & Codecs

Containers & Codecs tested so far:

MKV, MP4, AVI, FLV, WEBM, 3GP,
M4A, M4B, MKA, MP3, MP2, MP1, FLAC, AC3, AAC, DTS, TrueHD (Dolby Atmos),
Wave, Wave64, ALAC, TAK, TTA, DSD, Ogg Vorbis, AIFF, AMR, WavPack, WMA Lossy & Lossless, MusePack

....and any file as long as MediaInfo reports at least a video or audio track.
A full list can be found @ <https://mediaarea.net/en/MediaInfo/Support/Formats>.


This means:

1.	To process multiple files you can select whatever you want, not just video or audio files,
    and any file which does not have at least 1 video or audio track will be skipped and no ADS data will be stored.
    However, you might want to select less files to avoid unnecessary probing into the non-multimedia files.
2.	You can customize the output for any format I forgot or new formats recognized by MediaInfo.
    If format and/or codec information is shown, the displayed string can be customized arbitrarily WITHOUT reprocessing files.

Not processed by definition:

* directories
* reparse points
* junctions
* symlinks.

In the future symlinks may or may not be supported.

Some file types are better supported than others. For example, Foobar2000 can save ReplayGain in WAVs but RG is not recognized by MediaInfo.
