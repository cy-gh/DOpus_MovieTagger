# Available Actions

Following actions can be used in user buttons.

A preconfigured menu button with all actions is in the distro file.

| Command Name              | Button Label     | Description |
| ------------------------- | ---------------- | ----------- |
| ME_Update                 | Update Metadata  | Create/Update Metadata ADS for selected file |
| ME_Delete                 | Delete Metadata  | Delete attached Metadata ADS of selected file |
| ME_ClearCache             | Clear Cache      | Clear in-memory DOpus cache for Metadata read from ADS (see [Features](./features.html) |
| ME_ADSDump                | Copy Metadata    | Copy Metadata ADS of selected files to clipboard |
| ME_ADSCopy                | Dump Metadata    | Dump Metadata ADS of selected files to DOpus Output window [*]. |
| ME_MediaInfoDump          | Copy MediaInfo   | Run MediaInfo anew and copy its output to clipboard |
| ME_MediaInfoCopy          | Dump MediaInfo   | Run MediaInfo anew and dump its output to DOpus Output window [*]. |
| ME_EstimateBitrates       | Estimate Bitrate | Calculate bitrate using a list of target 'bitrate/pixel' values. |
| ME_ToggleEssentialColumns | Toggle Essential | Toggle a user-configurable list of 'essential' columns, can toggle DOpus columns |
| ME_ToggleOptionalColumns  | Toggle Optional  | Toggle a user-configurable list of 'optional' columns, can toggle DOpus columns |
| ME_ToggleOtherColumns     | Toggle Other     | Toggle a user-configurable list of 'other' columns, can toggle DOpus columns |
| ME_ToggleVerboseColumns   | Toggle Verbose   | Toggle a user-configurable list of 'verbose' columns, can toggle DOpus columns |
| ME_ConfigValidate         | Validate Config  | Validate current user configuration |
| ME_ShowHelp               | Show Help        | Show help |

💡 *Hint: Output window can be toggled via "Tools→Script Log" in standard config, or via custom button using: `Set UTILITY=OtherLog,Toggle`.*

## Estimate Bitrates

This button might seem alien at first. It helps you to choose an estimated bitrate if you re-encode your videos.

In theory, a RGB pixel for 8-bit displays requires 3 * 8 = 24 bit,
that is for uncompressed video, very similar to what WAV files are for audio.

In practice, most codecs are a. lossy and b. compress this information.
Bitrate is one way of measuring how a codec compresses a file, but it is a number independent of the picture size.
That is if you encode the same source material in 480p and 1080p using the same bitrate,
the 1080p will suffer. That is where **bitrate/pixel** (let's call it *bpp)* information comes in.
It takes the picture size into account.

Most codecs use bpp values between 0.1 (very blurry/blocky) to 5 to 10 (better looking).
Some highly efficient codecs like H265 often can achieve same quality with less bpp than other ones, e.g. H264.

Now, given 24 bpp is usually the theoretical max a codec should use, you can use this button
to calculate the bitrate values for a fixed list of target bpp's.
The values are shown automatically in the Output window.

Sample output:
```
Encode your video at the following bitrate (video track) for the targeted bits/pixel ratio
------------------------------------------------------------------------------------------
Read the docs before; depends on codec & video and it's not as simple as 3*8=24 b/p
Used target bit/pixel values: 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 50

 2021-07-25 16:38 MExt:  File: SampleFile.mp4 (1280 x 720) ==> [
    "0.5 bits/pixel =>   450 kbps",
    "  1 bits/pixel =>   900 kbps",
    "  2 bits/pixel =>  1800 kbps",
    "  3 bits/pixel =>  2700 kbps",
    "  4 bits/pixel =>  3600 kbps",
    "  5 bits/pixel =>  4500 kbps",
    "  6 bits/pixel =>  5400 kbps",
    "  7 bits/pixel =>  6300 kbps",
    "  8 bits/pixel =>  7200 kbps",
    "  9 bits/pixel =>  8100 kbps",
    " 10 bits/pixel =>  9000 kbps",
    " 15 bits/pixel => 13500 kbps",
    " 20 bits/pixel => 18000 kbps",
    " 25 bits/pixel => 22500 kbps",
    " 30 bits/pixel => 27000 kbps",
    " 50 bits/pixel => 45000 kbps"
]
```
As noted above, these are theoretical values after all.
You should experiment with your encoder app and codec settings and find out which works out best for you,
however, it is very safe to say, for lossy codecs, never ever exceed 24 bpp, it will not achieve better quality.
H265 easily achieves very good-looking videos with 1 to 5 or even less.
