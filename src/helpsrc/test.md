# IResult

Cheap, Rust-like Result object.
It semi-enforces you to unpack the results of method calls which might return an error/exception.

# Philosophy behind IResult:


A typical 'throw' can easily cut through the whole callstack and break the script abruptly,
unless there are multiple try/catch all the way to the top level.

JS/TS have no checked exceptions, as in Java, which explicitly warns about possible exceptions.
And neither Visual Studio Code (VSC) nor ESLint can warn about this either, i.e. the method you
call would throw an exception and which kind. You have to look into the code.

In a highly-generic language like JS, even with TypeScript additions, this spells disaster,
because the visible contract of the method signature is only the tip of the iceberg. Any method
can throw an exception at any time.

Put together, this means if the developer forgets to put try/catch blocks at every single step
of all possible callchains, eventually a script might abort prematurely and
leave the system in an unstable state. In the case of DOpus, an unstable state
might cause file loss, messed up file timestamps, and so on.


...But it gets worse:
JScript lacks "(call)stack" in errors and there is no JScript/WSH debugger we can use in DOpus.

These 2 have serious implications, as if the unchecked exceptions weren't enough:

 * Errors can be traced to the place where they really occurred but not which caller provoked it.
 * To show a meaningful error, the exception raiser must gather all necessary info,
   if it has that info at all, which would normally be in the call stack and put them into the exception.

This makes ambitious developments nearly impossible and would leave plugins as the only alternative.

This forced me to get inspirations from error-code based languages a la C and functional languages,
but especially Rust's Result and the following article:

http://joeduffyblog.com/2016/02/07/the-error-model/

*(Highly recommended read if you're a professional or ambitioned developer,
gives a tremendous overview of how different languages handle errors and has many useful links)*

Unlike in the article, I chose not to abandon the script on thrown exceptions,
but enforce myself to check the results of method calls by wrapping the errors in a *Result* object.

# How to use:

The Result objects cannot be consumed directly, e.g. `DOpus.output(fs.readFile(somefile))` will not work,
Instead Results must be checked first, as in the following:
```typescript
  var resRead = fs.readFile(somefile);
  // now use one of the .isOk(), .isErr(), .match() etc. methods
  if (resRead.isErr()) {
    // do something
    return res;
  }
  DOpus.output('file contents:\n' + res.ok);

  // or something like this
  resRead.match({
    ok:  (ok)  => { DOpus.output('file contents:\n' + res.ok); }
    err: (err) => { DOpus.output('Error occurred!\n' + res.err); }
  })
```

This does not prevent one from ignoring the error case and trying to use .ok value but
helps at the calling site by reminding that the call **might** return an error!


Unlike other implementations, my IResult has additional methods:

  * match(): another inspiration from Rust, as seen above
  * show(): can be used to show a DOpus dialog to the user, before re-returning the result's this object, e.g.

```typescript
  var resRead = fs.readFile(somefile);
  if (resRead.isErr()) {
    return res.show(); // shows a dialog only if it's an error
  }
  // proceed with Ok case.
  return res.show(); // this would show no dialog, since it's not an error
```

Other Rust macros/functions like `unwrap()`, `expect()` are **intentionally not implemented**,
in order not to give the developer any shortcut to ok values,
which would throw an exception if the result is an error instead.
Avoiding unchecked exceptions is the key here.


My implementation is a very cheap knock-off of Rust's Result. Apparently many others had the same idea:
  * https://github.com/vultix/ts-results
  * https://github.com/theroyalwhee0/result
  * https://github.com/hqoss/monads
  * https://github.com/karen-irc/option-t

These are more or less compatible with my implementation as well. Replace if you fancy.
