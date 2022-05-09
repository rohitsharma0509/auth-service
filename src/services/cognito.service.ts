import AWS, { AWSError, CognitoIdentityServiceProvider } from 'aws-sdk';
import { stringList } from 'aws-sdk/clients/datapipeline';
import logger from '../config/winston';
import crypto from 'crypto';
const fetch = require("node-fetch");
import md5 from 'md5'
import AuthMiddleware from '../middleware/auth.middleware';
import InvalidIDTokenError from '../exception/InvalidIDTokenError';

export interface SingInResponse{
  session: String;
  userId: String
}

export interface SingUpResponse{
  userId: String,
  userConfirmed: boolean
}

export interface VerifyChallengeResponse{
  AccessToken: string;
  RefreshToken: string;
  IdToken: string;
  ExpiresIn: string;
  ExpiresAt: string;
}

export interface GetAccessTokenResponse {
  AccessToken: string;
  IdToken: string;
  ExpiresIn: number;
  ExpiresAt: string;
  
}

export interface ErrorResponse{
  errorCode: string;
  errorMessage: string;
}

var cognitoRegion = process.env.COGNITO_REGION;
var cognitoClientId = process.env.COGNITO_CLIENT_ID;
var cognitoPoolId = process.env.COGNITO_USER_POOLID;
var password_constant = "StrongPassword1"

export default class Cognito {
  private config = {
    apiVersion: '2016-04-18',
    region: cognitoRegion,
  }
  private secretHash = '10j74r0nsekujafhd777t01omagltb34m16mvrb8e3v6rfop7ud3'; /* DO NOT CHANGE */
  private clientId = cognitoClientId;

  private cognitoIdentity;

  constructor(){
    this.cognitoIdentity = new AWS.CognitoIdentityServiceProvider(this.config);
  }

  public async signUpUser(phoneNumber: string): Promise<SingUpResponse> {
    logger.info(`SIGNUP_REQUEST for number:${this.maskPhoneNumber(phoneNumber)}`);
    var passwordHash = md5(phoneNumber);
    var params = {
      ClientId: this.clientId, /* required */
      Password: passwordHash, /* required */
      Username: phoneNumber, /* required */
      //SecretHash: this.hashSecret(username),
    }

    try {
      const data = await this.cognitoIdentity.signUp(params).promise()
      logger.info(`SIGNUP_SUCCESSFULL for number:${this.maskPhoneNumber(phoneNumber)}`)
      var confirmParam = {
        UserPoolId: cognitoPoolId,
        Username: phoneNumber
      }
      const con = await this.cognitoIdentity.adminConfirmSignUp(confirmParam).promise();
      logger.info('admin confirm response:'+JSON.stringify(con));
    //   var setPassword = {
    //     "Password": password_constant,
    //     "Permanent": true,
    //     "Username": phoneNumber,
    //     "UserPoolId": cognitoPoolId
    //  }
    //   const setPass = await this.cognitoIdentity.adminSetUserPassword(setPassword).promise();
    //   logger.info('setPasssword::'+setPass);

      return {
        userId: data.UserSub,
        userConfirmed: true
      };
    } catch (error) {
      logger.error(error)
      throw error;
    }
  }

  public async signInUser(phoneNumber: string): Promise<SingInResponse> {
    logger.info(`SIGNIN_REQUEST for number:${this.maskPhoneNumber(phoneNumber)}`)
    var passwordHash = md5(phoneNumber);
    var params = {
      AuthFlow: 'USER_PASSWORD_AUTH', /* required */
      ClientId: this.clientId, /* required */
      AuthParameters: {
        'USERNAME': phoneNumber,
        'PASSWORD':  passwordHash,
        //'SECRET_HASH': this.hashSecret(username)
      },  
    }
    try {
      let data = await this.cognitoIdentity.initiateAuth(params).promise();
      logger.info(`SIGNIN_SUCCESSFULL for number:${this.maskPhoneNumber(phoneNumber)}`)
      return {
        'userId': data.ChallengeParameters.USER_ID_FOR_SRP,
        'session': data.Session
      };
    } catch (error) {
      logger.error(`SIGNIN_FAILED for number:${this.maskPhoneNumber(phoneNumber)}`)
      logger.error(error);
      throw error;
    }
  }

  public async verifyChallenge(userId: string, code: string, session: string):Promise<VerifyChallengeResponse>{
    logger.info(`VERIFY_CHALLENGE for userId:${userId}`);
    var params = {
      UserPoolId: cognitoPoolId,
      ClientId: this.clientId,
      ChallengeName: 'SMS_MFA',
      ChallengeResponses: {
        "SMS_MFA_CODE": code,
        "USERNAME": userId
      },
      Session: session

    }
    try{
      
    var response  = await this.cognitoIdentity.adminRespondToAuthChallenge(params).promise();
    logger.info(`VERIFY_CHALLENGE_SUCCESSFULL for userId:${userId}`);
    var result = response.AuthenticationResult;
    let expiresAt = AuthMiddleware.decodeJwt(result.AccessToken).payload.exp;
    logger.info(`Calling Rider Service for Logging In for userId:${userId}`);
    await fetch(process.env.RIDER_PROFILE_SERVICE_PATH + "/auth/login", {
      method: 'POST',
      body: JSON.stringify({"token":result.IdToken}),
      headers: {'Content-Type': 'application/json; charset=UTF-8'} });
    logger.info(`Rider Token Cached for userId:${userId}`);
    return  {
      AccessToken: result.AccessToken,
      IdToken: result.IdToken,
      ExpiresIn: result.ExpiresIn,
      RefreshToken: result.RefreshToken,
      ExpiresAt: expiresAt
    };
  }catch(error){
    logger.error(`VERIFY_CHALLENGE_FAILED for userId:${userId}`);
    logger.error(error);
    throw error;
  }

  }

  public async getAccessToken(refreshToken: string):Promise<GetAccessTokenResponse>{
    logger.info('REFRESH_TOKEN_REQUEST received');
    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        "REFRESH_TOKEN": refreshToken,
      }
    }

    try {
      var response  = await this.cognitoIdentity.initiateAuth(params).promise();
      logger.info('REFRESH_TOKEN_REQUEST_SUCCESSFULL');
      const {AccessToken, ExpiresIn, IdToken} = response.AuthenticationResult;
      let expiresAt = AuthMiddleware.decodeJwt(AccessToken).payload.exp;
      return  {
        AccessToken,
        IdToken,
        ExpiresIn,
        ExpiresAt: expiresAt
      };
    } catch(error) {
      logger.error(error);
      if(error.code === 'NotAuthorizedException' && error.message.includes('expired')){
        error.code = 'SessionExpiredException'
      }
      logger.error('REFRESH_TOKEN_REQUEST_FAILED');
      throw error;
    }
  }


  public async logout(token): Promise<boolean> {
    var params = {
      AccessToken: token
    }
    try {
      const data = await this.cognitoIdentity.globalSignOut(params).promise();
      //logger.info('logout response is:'+JSON.parse(data));
      return true;
    }catch(error){
      logger.error(error);
      throw error;

    }
  }

  public async deletePhoneNumber(phoneNumber: string, idToken: string): Promise<boolean>{
    let phoneNumerFromToken = AuthMiddleware.decodeJwt(idToken).payload.phone_number;
    if(phoneNumerFromToken != phoneNumber){
      throw new InvalidIDTokenError('phone number in token doesn not match token', InvalidIDTokenError.PHONE_NUMBER_MATH_ERROR);

    }

    var params = {
      UserPoolId: cognitoPoolId,
      Username: phoneNumber
    }

    try{
    const response = await this.cognitoIdentity.adminDeleteUser(params).promise();
    return true;
    }catch(error){
      logger.error(error);
      throw error;

    }

  }

  private hashSecret(phoneNumber: string): string {
    return crypto.createHmac('SHA256', this.secretHash)
    .update(phoneNumber + this.clientId)
    .digest('base64')  
  } 

  private maskPhoneNumber(phoneNumber:string):string {
    return phoneNumber.length > 5 ? '*****' + phoneNumber.substring(phoneNumber.length - 5) : phoneNumber;

}

}