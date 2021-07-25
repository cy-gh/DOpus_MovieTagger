# Developer Information

*I am a professional software developer and consultant, albeit using different languages than JavaScript.
TypeScript, node.js, etc. are tech which I use only for hobby projects so my JavaScript knowledge might come across very tacky.
Corrections and feedback are more than welcome.*

## Experiences Collected

JScript has a few surprises under the hood but is overall **not** an implementation nice to work with.
Using Visual Studio Code, together with JSDoc annotations, ESLint and a TypeScript definition (see GitHub) file helped immensely.

Few things bugged me all along:

1. JScript is old and unmaintained. It roughly corresponds to EcmaScript 3, which is basically ancient. This means:
    1. No "use strict"
    2. No import, define, include, require or alike, i.e. no modularization
2. Exceptions have no stack.
3. There are no debugging possibilities.
4. JavaScript in general has no checked exceptions.
    Exceptions can cut through the call-stack and bubble up as they please.

During development of this script, it grew at times to 200-250 KB and >5000 lines of code in 1 file;
another bigger script (MTH) hit even 11k LOC, also in 1 file!
Once one gets accustomed to very good IDE support, JScript with no debugger support is already no fun,
but constantly scrolling up and down was the last straw.

So I decided to experiment with TypeScript and generate the .js from .ts.
Luckily, it worked... with some problems still left:

1. Mostly solved.
    1. Solved, thanks to TypeScript's quite powerful typing system and good IDE support.
    2. Partially solved. There is still no way to use include or require, so npm packages such as Unit Tests
       are still out of question but using `///<reference path='./std/libStdDev.ts' />` and alike does the modularization.
2. Not solved.
3. Not solved.
4. Mostly solved. I took inspirations from Rust's Result & Option objects.
   Rust is by a long shot the most marvellous mainsteam language I used.
   And once you get used to these 2, you miss them instantly in other languages.

## Migrating JScript to TypeScript

Converting JScript on its own was mostly trivial, since TypeScript is the superset.
However, in order to take advantage of the type system, which is the whole point of TS,
I had to go through entire code and both convert JSDoc to TS type declarations,
and declare some helper types to convince TS Checker that my custom object is a key-value pair.
However, this was also mostly painless.

The real driver of the migration was, however, the Multi-Threaded Hasher (MTH) script.
If you look at its old source code (on GitHub - not released for public usage yet),
you will see many classes and singletons such as `logger`, `ads`, `stopwatch`, `cache`...

The biggest challenge and simultaneously award by far was converting these classes to reusable libraries.
**That** took a lot of time.

## Injectable Dependencies & *Standard Library*

If your .js script is a monolith and your `ads` assumes it has access to `cache`
you don't realize this problem, but what if in your next .ts-based development your `ads` does not have `cache`?
What if you don't want a `logger` but all your libraries have `logger.normal('...)` lines?
What about if you don't want a `config` object because your script is very simple?

So all libraries have been turned to *(mostly) standalone* ones, with injectable objects such as logger & cache.

Why *(mostly) standalone*? There is a **libStdDev.ts** (see above) which defines all the interfaces, enums, functions, etc.
which are common to future developments. It also contains polyfills, implements IResult & IOption.
All libraries must reference this file and must implement the `ILibrary` interface.

This file is well-documented.


## On Unchecked Exceptions/Errors vs Result & Option

JavaScript exceptions are already ugly to deal with. Unless you put `try-catch` everywhere along the callstack,
the error.stack is the only way of finding out where it happened. But JScript has no .stack!

Moreover, I unfortunately know of no way to make the IDE to tell me that the method I want to call might throw an exception.
These are called "checked exceptions." Java and some other languages enforce you to handle these as soon as possible.
Realizing that if your JS method calls many methods, and those yet other methods, one of which might throw an exception,
development became very tedious.

Solution: IException and Result, inspired by Rust.

All exceptions have been replaced with IException and these exceptions never thrown directly but wrapped in Result.
Basically only handful methods in the whole codebase have a `throw` statement and have been replaced by these 2.

Example:

### IException
To raise an exception you would normally do this:
```ts
if (!this.getConfigKeysMetaMap().exists(key)) {
    throw new Error('Value of ' + key + ' is not set yet');
}
```

Instead you do this:

```ts
if (!this.getConfigKeysMetaMap().exists(key)) {
    return g.ResultErr(Exc(ex.Uninitialized, fname, 'Value of ' + key + ' is not set yet')).show();
}
```
`Exc()` is a global method and `ex.Uninitialized` is from the global enum `ex`.
`g.ResultErr()` is a convenience method which creates a new `Result<_, ErrorType>`, in this case the ErrorType is `IException<ex>`.

The caller can easily distinguish between different exceptions types by comparing it to the same enum,
and choose to handle or ignore it and return the same Result to the caller.

### IResult

Given `usr.getValue()` has this signature:
```ts
getValue(key: string, autoGetDOpusValue = true): IResult<any, IException<ex>> {...}
```

if the call `usr.getValue()` might throw an exception you would normally do this:
```ts
try {
    logger.setLevel(usr.getValue(CfgU.DEBUG_LEVEL));
} catch (e) {
    // somehow show the error.
    // returning or continuing using a default value
    // highly depends on the case.
}
```

And it became this:
```ts
usr.getValue(CfgU.DEBUG_LEVEL).match({
  ok: (dbgLevel: number) => logger.setLevel(dbgLevel),
  err: (e: IException<ex>) => e.show()
});
// alternatively
const res = usr.getValue(CfgU.DEBUG_LEVEL);
if (res.isErr()) { res.show(); return; } // note the .isErr()
logger.setLevel(res.ok);                 // note the .ok
// or
const res = usr.getValue(CfgU.DEBUG_LEVEL);
const desiredVal = res.show().ok || defaultVal;
logger.setLevel(desiredVal);
// or in one swoop
const res = usr.getValue(CfgU.DEBUG_LEVEL);
logger.setLevel(res.show().ok || defaultVal);
// or even shorter
logger.setLevel(usr.getValue(CfgU.DEBUG_LEVEL).show().ok || defaultVal);
```
The IResult's `show()` is a convenience method which checks if .err is defined,
automatically shows it if it's an error, and returns the Results back if it's not an error.

Because `getValue()` is a Result now and might include an error, TypeScript reminds us automatically
that we cannot use it *directly*... Well, we could ignore it and attempt to use `result.ok` value directly,
but that's stupidity from that point on.


## Will I develop medium/large scripts again?

Definitely, although I'm also ogling DOpus plugin development, but to take up a challenge, not with C++,
but Rust and Sciter, to experiment with cross-platform

Leaving that aside, scripts still have many advantages: faster prototyping, much easier changes without firing up your IDE, etc.
And now that I have tasted TypeScript's advantages and built a couple reusable libraries, expect improvements and other scripts.



## Editing Source Code

### Cloning and Building from .TS Sources

VSCode (I prefer [VSCodium](https://portapps.io/app/vscodium-portable/)) comes with a built-in TS compiler (tsc), and generating the .js is as as simple as (all in 1 line):

```
tsc --target es3 --lib es5,scripthost --allowJS --newline LF --removeComments --out bin\\DOpus_MovieTagger.js src\\index.ts
& copy bin\\DOpus_MovieTagger.js \"%HOMEDRIVE%%HOMEPATH%\\AppData\\Roaming\\GPSoftware\\Directory Opus\\Script AddIns\""
```
If you use node, add npx in front of tsc, i.e. `npx tsc --target es3...`.

If you clone the Github repository, there's both the `package.json` for node and `.vscode` dir for VSCode.
Press CTRL-SHIFT-B to select a build task, which you can later reuse to compile the .js and copy to DOpus scripts directory.

### VSCodium & GitHub integration

*This might also apply to vanilla VSCode, not tested. I call both VSCode and VSCodium simply VSC.*

In order to activate automatic GitHub login, [set up your access token in GitHub](https://github.com/settings/tokens) first.
Then you can open your repository folder in VSC and enter this in the terminal window:
```
git remote set-url origin https://<YOUR_GH_USER>:<YOUR_GH_TOKEN>@github.com/<YOUR_GH_USER>/<REPOSITORY>.git/
```
e.g. (not real token):
```
git remote set-url origin https://dummy_user:0123456789ABCDEF0123456789ABCDEF01234567@github.com/dummy_user/My_Wonderful_App.git/

```
Now you can commit, pull, push comfortably from VSC sidebar.


### Editing (Generated) .JS code

*The newest versions of this addin is generated from TypeScript sources. Generated JavaScript code is not as pretty as previous versions and fails many ESLint checks. Proceed at your own risk.*

Editing (generated) source code is not recommended but is always an option. Of course you have to unzip the .OSP file first.

In order to add/remove/change existing fields, first check the formatted Metadata ADS for a selected file.
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

# Credits

* [MDN/Mozilla Developer Network documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript). Any JS development without MDN is near impossible and tried-and-tested polyfills are priceless.

* [TypeScript documentation](https://www.typescriptlang.org/docs/handbook/).

* [Visual Studio Codium Portable](https://portapps.io/app/vscodium-portable/) which does not include VSCode's telemetry functions.

* [Typora](https://typora.io/).

* Many contributors at [StackOverflow](https://stackoverflow.com/questions/tagged/typescript)!

* The sprintf.js library is &copy; of [sprintf.js](https://github.com/alexei/sprintf.js). This is wrapped in TS in libStdDev.ts. In future, it might be replaced with [sprintfit](https://github.com/joseluisq/sprintfit) which is pure TS, simpler, faster
but supports only "%s".

    I might also replace it with Rust println!() style placeholders, i.e. `sprintf("%s: %s", str1, str2)` would become `println("{}: {}, {:?}", any1, any2, complexObjWithToStringMethod)`.
