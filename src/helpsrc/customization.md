If you want to adjust the VCodec & ACodec output, see options:
    CODEC_APPEND_ADDINFO
    CODEC_USE_SHORT_VARIANT
    RESOLUTION_APPEND_VERTICAL
    LOOKUP_CODECS - as a LAST resort!

LOOKUP_CODECS can be used to show identical info to FourCC if you want,
but I tell you FourCC is pretty useless, it's not standardized nor filled/respected/recognized by many encoders/muxers.
Suggested: turn on one or more of the 'HELPER' columns (Toggle Verbose action) to see what info you can use to identify a certain codec.

If you want to rename the labels, you need to create a JSON file in the script directory;
see Configuration->Reference section for more info.

First check the formatted Metadata ADS, e.g. via Tooltip or Dump/Copy for a selected file.
Some fields are already stored in ADS, but have no dedicated columns, and you'd need to create only a new column.
Chances are very high that the information you need is already there (except FourCC, since it is a placebo BS field).

If you want to add new buttons or columns based on available info, see OnInit() method
and use one of the existing commands & fields as template; note few fields e.g. 'Available' does not use MultiCol!

If the info you want is not in the ADS, copy/dump the MediaInfo output for the file.
If MediaInfo does recognize the field you want, check OnME_Update() and add the field.
HOWEVER,
adding new fields means adding new fields to the structure stored in ADS
and that means, you will need to update previously processed files with the ADS before you can use new fields!
Please keep that in mind.

Feature Requests:

Requesting new fields/user option is ok, with some conditions:
    - No obscure fields, like encoder 'Format_Settings_Matrix', should be usable by many
    - My time allows it
    - You must supply a sample file and MediaInfo output of the sample, where the field(s) you want are marked clearly
