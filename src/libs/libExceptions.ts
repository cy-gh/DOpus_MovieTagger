///<reference path='./libGlobal.ts' />

/*
    8888888888 Y88b   d88P  .d8888b.  8888888888 8888888b. 88888888888 8888888  .d88888b.  888b    888  .d8888b.
    888         Y88b d88P  d88P  Y88b 888        888   Y88b    888       888   d88P" "Y88b 8888b   888 d88P  Y88b
    888          Y88o88P   888    888 888        888    888    888       888   888     888 88888b  888 Y88b.
    8888888       Y888P    888        8888888    888   d88P    888       888   888     888 888Y88b 888  "Y888b.
    888           d888b    888        888        8888888P"     888       888   888     888 888 Y88b888     "Y88b.
    888          d88888b   888    888 888        888           888       888   888     888 888  Y88888       "888
    888         d88P Y88b  Y88b  d88P 888        888           888       888   Y88b. .d88P 888   Y8888 Y88b  d88P
    8888888888 d88P   Y88b  "Y8888P"  8888888888 888           888     8888888  "Y88888P"  888    Y888  "Y8888P"
*/
namespace exc {


    /**
     * @param {function} fnCaller
     * @param {string} message
     * @param {string|function} where
     * @constructor
     */
    export interface IUserException {
        readonly name: string;
        readonly message: string;
        readonly where: string;
        // constructor (fnCaller: Function, message:string, where:string|Function): IUserException;
    }

    /**
     * @param {function} fnCaller
     * @param {string} message
     * @param {string|function} where
     * @constructor
     */
    abstract class UserException implements IUserException{
        public readonly name: string;
        public readonly message: string;
        public readonly where: string;
        constructor (fnCaller: Function, message:string, where:string|Function) {
            this.name    = g.funcNameExtractor(fnCaller);
            this.message = message + ' - added by UserException';
            this.where   = typeof where === 'string' ? where : typeof where === 'function' ? g.funcNameExtractor(where) : where;
        }
    }

    /** @constructor @param {string} message @param {string|function} where */
    export class NotImplementedYetException extends UserException {
        constructor(message: string, where: string|Function) { super(NotImplementedYetException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class UninitializedException extends UserException {
        constructor(message: string, where: string|Function) { super(UninitializedException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class DeveloperStupidityException extends UserException {
        constructor(message: string, where: string|Function) { super(DeveloperStupidityException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class InvalidManagerCommandException extends UserException {
        constructor(message: string, where: string|Function) { super(InvalidManagerCommandException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class InvalidUserParameterException extends UserException {
        constructor(message: string, where: string|Function) { super(InvalidUserParameterException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class JSONParsingException extends UserException {
        constructor(message: string, where: string|Function) { super(JSONParsingException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class InvalidParameterTypeException extends UserException {
        constructor(message: string, where: string|Function) { super(InvalidParameterTypeException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class InvalidParameterValueException extends UserException {
        constructor(message: string, where: string|Function) { super(InvalidParameterValueException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class SanityCheckException extends UserException {
        constructor(message: string, where: string|Function) { super(SanityCheckException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class StreamReadWriteException extends UserException {
        constructor(message: string, where: string|Function) { super(StreamReadWriteException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class FileCreateException extends UserException {
        constructor(message: string, where: string|Function) { super(FileCreateException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class FileReadException extends UserException {
        constructor(message: string, where: string|Function) { super(FileReadException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class InvalidFormatException extends UserException {
        constructor(message: string, where: string|Function) { super(InvalidFormatException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class UnsupportedFormatException extends UserException {
        constructor(message: string, where: string|Function) { super(UnsupportedFormatException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class ThreadPoolMissException extends UserException {
        constructor(message: string, where: string|Function) { super(ThreadPoolMissException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class InvalidNumberException extends UserException {
        constructor(message: string, where: string|Function) { super(InvalidNumberException, message, where) }
    }
    /** @constructor @param {string} message @param {string|function} where */
    export class UserAbortedException extends UserException {
        constructor(message: string, where: string|Function) { super(UserAbortedException, message, where) }
    }

}
