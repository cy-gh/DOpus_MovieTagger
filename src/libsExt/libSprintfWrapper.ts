///<reference path='./libSprintf.js' />

// this file wraps the JS file as a TS namespace
// it's possible thanks to the genius solution from https://stackoverflow.com/a/54946767
const wrap = <T extends Array<any>, U>(fn: (...args: T) => U) => {
    return (...args: T): U => fn(...args)
}
namespace libSprintfjs {
    /**
     *
     * The placeholders in the format string are marked by % and are followed by one or more of these elements, in this order:
     *
     * An optional number followed by a $ sign that selects which argument index to use for the value. If not specified, arguments will be placed in the same order as the placeholders in the input string.
     *
     * An optional + sign that forces to precede the result with a plus or minus sign on numeric values. By default, only the - sign is used on negative numbers.
     *
     * An optional padding specifier that says what character to use for padding (if specified). Possible values are 0 or any other character preceded by a ' (single quote). The default is to pad with spaces.
     *
     * An optional - sign, that causes sprintf to left-align the result of this placeholder. The default is to right-align the result.
     *
     * An optional number, that says how many characters the result should have. If the value to be returned is shorter than this number, the result will be padded. When used with the j (JSON) type specifier, the padding length specifies the tab size used for indentation.
     *
     * An optional precision modifier, consisting of a . (dot) followed by a number, that says how many digits should be displayed for floating point numbers. When used with the g type specifier, it specifies the number of significant digits. When used on a string, it causes the result to be truncated.
     *
     * A type specifier that can be any of:
     *
     *  * **%** — yields a literal % character
     *  * **b** — yields an integer as a binary number
     *  * **c** — yields an integer as the character with that ASCII value
     *  * **d** or i — yields an integer as a signed decimal number
     *  * **e** — yields a float using scientific notation
     *  * **u** — yields an integer as an unsigned decimal number
     *  * **f** — yields a float as is; see notes on precision above
     *  * **g** — yields a float as is; see notes on precision above
     *  * **o** — yields an integer as an octal number
     *  * **s** — yields a string as is
     *  * **t** — yields true or false
     *  * **T** — yields the type of the argument1
     *  * **v** — yields the primitive value of the specified argument
     *  * **x** — yields an integer as a hexadecimal number (lower-case)
     *  * **X** — yields an integer as a hexadecimal number (upper-case)
     *  * **j** — yields a JavaScript object or array as a JSON encoded string
     * @param {string} key formatting string
     * @param {any[]} arguments
     * @returns string
     */
    export const sprintf: Function        = wrap(sprintfjs.sprintf);
    /**
     *
     * The placeholders in the format string are marked by % and are followed by one or more of these elements, in this order:
     *
     * An optional number followed by a $ sign that selects which argument index to use for the value. If not specified, arguments will be placed in the same order as the placeholders in the input string.
     *
     * An optional + sign that forces to precede the result with a plus or minus sign on numeric values. By default, only the - sign is used on negative numbers.
     *
     * An optional padding specifier that says what character to use for padding (if specified). Possible values are 0 or any other character preceded by a ' (single quote). The default is to pad with spaces.
     *
     * An optional - sign, that causes sprintf to left-align the result of this placeholder. The default is to right-align the result.
     *
     * An optional number, that says how many characters the result should have. If the value to be returned is shorter than this number, the result will be padded. When used with the j (JSON) type specifier, the padding length specifies the tab size used for indentation.
     *
     * An optional precision modifier, consisting of a . (dot) followed by a number, that says how many digits should be displayed for floating point numbers. When used with the g type specifier, it specifies the number of significant digits. When used on a string, it causes the result to be truncated.
     *
     * A type specifier that can be any of:
     *
     *  * **%** — yields a literal % character
     *  * **b** — yields an integer as a binary number
     *  * **c** — yields an integer as the character with that ASCII value
     *  * **d** or i — yields an integer as a signed decimal number
     *  * **e** — yields a float using scientific notation
     *  * **u** — yields an integer as an unsigned decimal number
     *  * **f** — yields a float as is; see notes on precision above
     *  * **g** — yields a float as is; see notes on precision above
     *  * **o** — yields an integer as an octal number
     *  * **s** — yields a string as is
     *  * **t** — yields true or false
     *  * **T** — yields the type of the argument1
     *  * **v** — yields the primitive value of the specified argument
     *  * **x** — yields an integer as a hexadecimal number (lower-case)
     *  * **X** — yields an integer as a hexadecimal number (upper-case)
     *  * **j** — yields a JavaScript object or array as a JSON encoded string
     * @param {string} key formatting string
     * @param {any[]} arguments
     * @returns string
     */
    export const vsprintf: Function       = wrap(sprintfjs.vsprintf);
    // not used at the moment
    // export const sprintf_format: Function = wrap(sprintfjs.sprintf_format);
    // export const sprintf_parse: Function  = wrap(sprintfjs.sprintf_parse);
}
