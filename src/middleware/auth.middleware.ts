import { Request, Response } from 'express';
import jwkToPem from 'jwk-to-pem';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import logger from '../config/winston';

let pems: { [key: string]: any }  = {}

var cognitoRegion = process.env.COGNITO_REGION;
var cognitoUserPoolId = process.env.COGNITO_USER_POOLID;

class AuthMiddleware {
  private poolRegion: string = cognitoRegion;
  private userPoolId: string = cognitoUserPoolId;

  constructor() {
    this.setUp()
  }

  static decodeJwt(token: string) {
    let decodedJwt: any = jwt.decode(token, { complete: true });
    return decodedJwt;

  };

  private verifyToken(req: Request, resp: Response, next): void {
    const token = req.headers.authorization;
    if (!token) return resp.status(401).end();

    let decodedJwt: any = jwt.decode(token, { complete: true });
    if (decodedJwt === null) {
      resp.status(401).end()
      return
    }
    logger.info(`jwt decoded for:${decodedJwt.payload.sub}`)
    let kid = decodedJwt.header.kid;
    let pem = pems[kid];
    logger.info(pem)
    if (!pem) {
      resp.status(401).end()
      return
    }
    jwt.verify(token, pem, function (err: any, payload: any) {
      if (err) {
        resp.status(401).end()
        return
      } else {
        next()
      }
    })
  }

  private verifyIDToken(req: Request, resp: Response, next): void {
    const token = req.get('idToken');
    if (!token) return resp.status(401).end();

    let decodedJwt: any = jwt.decode(token, { complete: true });
    if (decodedJwt === null) {
      resp.status(401).end()
      return
    }
    logger.info(`jwt decoded for:${decodedJwt.payload.sub}`)
    let kid = decodedJwt.header.kid;
    let pem = pems[kid];
    logger.info(pem)
    if (!pem) {
      resp.status(401).end()
      return
    }
    jwt.verify(token, pem, function (err: any, payload: any) {
      if (err) {
        resp.status(401).end()
        return
      } else {
        next()
      }
    })
  }

  private async setUp() {
    const URL = `https://cognito-idp.${this.poolRegion}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`;

    try {
      const response = await fetch(URL);
      if (response.status !== 200) {
        throw 'request not successful'
      }
      const data = await response.json();
      const { keys } = data;
        for (let i = 0; i < keys.length; i++) {
          const key_id = keys[i].kid;
          const modulus = keys[i].n;
          const exponent = keys[i].e;
          const key_type = keys[i].kty;
          const jwk = { kty: key_type, n: modulus, e: exponent };
          const pem = jwkToPem(jwk);
          pems[key_id] = pem;
        }
        logger.info("got PEMS")
    } catch (error) {
      logger.error(error)
      logger.error('Error! Unable to download JWKs');
    }
  }
}

export default AuthMiddleware