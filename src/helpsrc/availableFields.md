# Available Fields/Columns

Columns are by default prefixed with ME (Media Extensions). Labels can be customized via external config file, see [Configuration](./configuration.html).

Note although some of these fields also exist in DOpus, they are not available for all container & codec types.

| Field Label             | Description |
| ----------------------- | ----------- |
| HasADS/IsAvailable      | File has Metadata ADS (calculated separately, not Multicol) [++] |
| NeedsUpdate/Dirty       | File has been changed since Metadata ADS has been written [++] |
| VCodec                  | Video codec (only 1st video stream) [+] |
| ACodec                  | Audio codec (only 1st audio stream) [+] |
| TBitrate                | Total bitrate [++] |
| VBitrate                | Video bitrate (only 1st video stream) [+] |
| ABitrate                | Audio bitrate (only 1st audio stream) [+] |
| VCount                  | Number of video streams [++] |
| ACount                  | Number of audio streams [++] |
| TCount                  | Number of text (subtitle) streams [++] |
| OCount                  | Number of other (chapters, menus...) streams [++] |
| ABitrate Mode           | VBR/CBR if available (ABR is principally recognized as VBR) [++] |
| TDuration               | Total container duration [+]/[++] |
| VDuration               | Video duration [+]/[++] |
| Auration                | Audio duration [+]/[++] |
| Duration (Combo)        | Combined duration, only a single one is displayed unless any of 3 differs from each other (5s tolerance), i.e. detects mismatching streams [++] |
| Multi-Audio             | File has multiple audio streams (yes/no) [++] |
| Audio Language          | Audio language if set (only few containers support this) [++] |
| Audio Channels          | Number of channels in 1st audio track, e.g. 2.0, 5.1, 7.1  [+] |
| ReplayGain              | File has ReplayGain (RG) info stored (some formats support RG but MediaInfo does not parse it) [++] |
| Audio Compression Mode  | Lossy/Lossless [++] |
| AspectRatio (Raw)       | Video aspect ratio (AR), i.e. width:height, e.g. 1.333, 2.35, etc. [++] |
| AspectRatio (Disp)      | Video display AR if the format supports it and file has a different AR than its raw AR [++] |
| AspectRatio (Combined)  | Combined video AR, only a single AR is displayed, if its display AR differs from raw AR, it's shown in parentheses [++] |
| Gross byterate          | Gross average KB, kilobytes per second, for the file, simply filesize:duration [++] |
| Bits per Pixel          | Video average bits per pixel, i.e. video bitrate/(width*height); only 1st video stream [++] |
| Dimensions              | Video dimensions [+] |
| Resolution              | 240p, 360p, 480p, 720p, 1080p, 4K, 8K - Customizable, can append '(Vertical)' for vertical videos [++] |
| Frame Rate              | Video frame rate [+] |
| Frame Count             | Video frame count [++] |
| Subtitle Language       | Subtitle language if available (only 1st text stream) [++] |
| Encoded Library         | Library used to encode the video if available, incl. technical info [++] |
| Encoded Lib Name        | Library used to encode the video if available no technical info  [++] |
| VCodec ID               | Video Codec ID (raw), if available [++] |
| ACodec ID               | Audio Codec ID (raw), if available [++] |
| AFormat Version         | Audio Format Version, if available [++] |
| AFormat Profile         | Audio Format Profile, if available [++] |
| Encoder App             | Container Encoder App, if available [++] |
| ADS (Formatted)         | Formatted ADS data (always as JSON), suitable to show in InfoTips [++] |
| ADS (Raw)               | Unformatted ADS data (always as JSON), only for sake of completeness, not very suitable as a column or InfoTip [++] |
| Helpers                 | 3 helper columns for the container, video & audio tracks, which you can use to adjust display Codec names [++] |

where:
* [+] Recognizes more formats and/or is more accurate than DOpus
* [++] No DOpus counterpart

Unlike DOpus, output of following columns are user-customizable (editing source code is also another option):
* VCodec
* ACodec
* Audio Channels
* Resolution

Although there are no fields for the following, they are stored and available in ADS (see section Adding/Adjusting Fields)

* Additional & Extra info fields for Container, Video, Audio & Text
    These container and codec-specific fields can contain a lot information
    e.g. ReplayGain, used encoding settings, date-time of encoding...
    which can be used show new fields/columns or adjust existing ones.
    For an explanation how they can be used, see [Configuration](./configuration.html#Customizing-Column-Labels) section *Customizing Column Labels*.
* Video Stream Size
* Audio Stream Size
* Audio Format Settings Mode
* Audio Sampling Rate

Note some of the fields (e.g. sampling rate) above are already supported by DOpus well close to 100%, albeit not for all containers & codecs.

Any other info should be used from DOpus builtin fields.
