# Features

* Information follows file/ADS

    As long as you use NTFS, the ADS information follows the file.
    That means, you can rename the *parent* file as you wish, no information is lost.

* Nearly constant scanning speed

    File scanning speed does NOT depend on the individual file sizes
    since most containers store metadata at the front of the files and this is what MediaInfo parses.
    This means, the overall scanning duration depends more or less
    on the total number of files, not their sizes.
    The scanning speed depends on your disk's read speed of course
    but since SDD & NVMEs ubiquitous these days the speed is pretty acceptable.

* *Dirty* detection

    If a file has been changed, e.g. overwritten by a program or its file-specific metadata (ID3, keywords, etc.)
    have been updated, this is automatically recognized and can notify user to update the Metadata ADS.

* Progress window

    *Pause/Resume* & *Abort* actions are supported fully.
    *Skip* seemed unnecessary to me since scanning speed per file is pretty high.

* Caching

    *This section is subject to change.*

    This is an optional feature.

    Disabling the cache and/or clearing it does not seem to make a huge impact; YMMV. Read on if you're curious.

    This script is usually much faster than DOpus' own meta-fields,
    but caching did not bring an even bigger performance gain I hoped it would.

    Any seen file, as long as the columns are visible, are cached in DOpus memory, ~1k of data per file.
    If the file path, name & last modification time have not been changed, the cached info is used.

    The Metadata info is principally processed using POJO/JSON,
    and my initial concern was reading JSON strings, converting them to POJO and back
    would be very time-consuming has been removed by another factor.

    After much testing, it is safe to say, caching does not make the refresh speed of columns instantaneous as I hoped.
    DOpus has a minimum overhead for script columns/fields,
    i.e. even if you program the simplest fields/columns, updating the columns in a big directory
    still is not instantaneous, although DOpus-internal fields are shown instantly... sometimes.
    Presumably, when DOpus shows the fields instantly, some external cache like disk/OS cache is used
    and DOpus does not cache any extra data itself.

    The info cached by this script is 'stringified JSONs', i.e. POJOs (Plain Old Javascript Objects) converted to readable format.
    This information is read and parsed (converted back to an in-memory POJO) whenever needed.
    Even if this takes some computing time, DOpus does not allow you to keep POJOs in memory for too long,
    these are removed from memory as soon as DOpus show 'Script Completed' in output window, even if you use Script.Vars object.
    Script.Vars can store simple types (integer, string, etc.) or DOpus objects, e.g. Vector & Map but not POJOs.
    Since it is too much hassle for me to convert all JS object accesses from object.field to DOPus Map[] notation,
    I'm not planning to rewrite it and cache directly the parsed JSONs.
    Considering script-addins do not run faster than a certain speed, a rewrite would not bring much speed increase anyway.
    The only possible solution seems to be developing a DOpus plugin, which I'm not planning at the moment.

    At some point I added a parameter cache_max_items to limit the number of items in the cache
    based on timestamp of the item added to the cache
    but iterating over hash arrays based on an attribute other than the hash's key field turned out to be an unnecessary hassle,
    too much pain for very little gain, so such a feature won't be re-implemented, just use the CLEAR CACHE command.

* Multiple Video Tracks

    You might wonder why "only 1st video stream" is mentioned elsewhere.
    The wonderful Matroska format allows to mux multiple video streams into a single file.
    But unlike files with multiple audio streams, no media player I know of can play such files in entirety,
    however, for the sake of completeness & OCD I have included them in the script.
