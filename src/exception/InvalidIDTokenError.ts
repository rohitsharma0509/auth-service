import { NumberOfBytesType } from "aws-sdk/clients/kms";


export default class InvalidIDTokenError extends Error{
    static PHONE_NUMBER_MATH_ERROR: string = 'PhoneNumberDoesNot';
    private code: string;
    private statusCode: Number;
    constructor (message, code) {
        super(message)
        Error.captureStackTrace(this, this.constructor);
    
        this.name = this.constructor.name
        this.statusCode = 400
        this.code = code
      }
    }