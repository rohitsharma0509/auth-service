import { String } from 'aws-sdk/clients/cloudhsm';
import * as express from 'express';
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import AuthMiddleware from '../middleware/auth.middleware';
import Cognito from '../services/cognito.service';
import logger from '../config/winston';
const fetch = require("node-fetch");
const DbPosts = require('../models/DbPost');

const DEFAULT_AUTH_TYPE = 2;


class AuthController {
    public path = '/auth'
    public router = express.Router()
    private authMiddleware;

    constructor() {
      this.authMiddleware = new AuthMiddleware();
        this.initRoutes()
    }

    public initRoutes() {
        this.router.post('/signup', this.validateBody('signUp'), this.signUp)
        this.router.post('/signin', this.validateBody('signIn'), this.signIn)
        this.router.post('/verify-challenge', this.validateBody('verify'), this.verifyChallenge)
        this.router.post('/get-access-token', this.validateBody('accessToken'), this.getAccessToken)
        this.router.post('/get-auth-type', this.validateBody('phoneType'), this.sendAuthType)
        this.router.post('/logout',this.authMiddleware.verifyToken, this.logout)
        this.router.delete('/mobile/:phoneNumber',this.authMiddleware.verifyToken, this.authMiddleware.verifyIDToken, this.deletePhoneNumber)
        this.router.delete('/mobile',this.validateBody('phoneType'), this.authMiddleware.verifyToken, this.authMiddleware.verifyIDToken, this.deletePhoneNumberInBody)
    }


    // Signup new user
    signUp = (req: Request, res: Response) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(422).json({ errors: result.array() });
      }
      const { phoneNumber } = req.body;

      let cognitoService = new Cognito();
      cognitoService.signUpUser(phoneNumber)
        .then(success => {
          res.status(200).json(success).end();
        }).catch(error=>{
          res.status(400).json({"error": error})
        })
    }


    // Use username and password to authenticate user
    signIn = (req: Request, res: Response) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(422).json({ errors: result.array() });
      }
      
      const { phoneNumber } = req.body;
      let cognitoService = new Cognito();
      cognitoService.signInUser(phoneNumber)
        .then(success => {
          res.status(200).json(success);
        })
        .catch(error => {
          res.status(400).json({"error": error})
        });
    }

    verifyChallenge = (req: Request, res: Response) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(422).json({ errors: result.array() });
      }
      const { userId, code, session } = req.body;

      let cognitoService = new Cognito();
      cognitoService.verifyChallenge(userId, code, session)
        .then(success => {
          success!=undefined ? res.status(200).json(success) : res.status(400).end()
        })
        .catch(error => {
          res.status(400).json({"error": error})
        })
    }

    getAccessToken = (req: Request, res: Response) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(422).json({ errors: result.array() });
      }
      const { refreshToken } = req.body;

      let cognitoService = new Cognito();
      cognitoService.getAccessToken(refreshToken)
        .then(success => {
          success!=undefined ? res.status(200).json(success) : res.status(400).end()
        })
        .catch(error => {
          res.status(400).json({"error": error})
        })
    }

    sendAuthType = async (req: Request, res: Response)  => {
      const { phoneNumber } = req.body;
      logger.info(`Invoking get auth type for mobile:${phoneNumber}`);
      try {
        const getAuthTypeData = await DbPosts.find({phoneNumber: `${phoneNumber}`});
        let type = getAuthTypeData.length ? getAuthTypeData[0].authType : DEFAULT_AUTH_TYPE
        logger.info(`Auth type for mobile:${phoneNumber} is: ${type}`);
        res.json({
          phoneNumber, 
          authType: type
        });
        
      } catch(err) {
        console.error(err);
        res.json({error: err})
      }

    }

    // getAuthType = async (req: Request, res: Response)  => {
    //   try {
    //     const getAuthTypeData = await DbPosts.find();
    //     res.json(getAuthTypeData);
    //   } catch(err) {
    //     res.json({messageee: err})
    //   }
    // }


    logout = (req: Request, res: Response) => {

      let cognitoService = new Cognito();
      const token = req.headers.authorization;
      cognitoService.logout(token)
        .then(() => {
           res.status(200).end()
        }).catch(error => {
          res.status(400).json({"error": error})
        });
        console.log(req.headers);
        logger.info('Rider Logged Out');
        fetch(process.env.RIDER_PROFILE_SERVICE_PATH + "/auth/logout", {
          method: 'POST',
          body: JSON.stringify({"token":token}),
          headers: {'Content-Type': 'application/json; charset=UTF-8'} })  
    }

    deletePhoneNumber = (req: Request, res: Response) => {
      let cognitoService = new Cognito();
      const idToken:string = req.get('idToken');
      const phoneNumber:string = req.params.phoneNumber;
      cognitoService.deletePhoneNumber(phoneNumber, idToken)
      .then(() => {
        res.status(200).end()
      })
      .catch(error => {
        res.status(400).json({"error": error})
      });

    }

    deletePhoneNumberInBody = (req: Request, res: Response) => {
          let cognitoService = new Cognito();
          const idToken:string = req.get('idToken');
          const { phoneNumber } = req.body;
          cognitoService.deletePhoneNumber(phoneNumber, idToken)
          .then(() => {
            res.status(200).end()
          })
          .catch(error => {
            res.status(400).json({"error": error})
          });

        }

    private validateBody(type: string) {
      switch (type) {
        case 'signUp':
          return [
            body('phoneNumber').notEmpty().isLength({min: 9}),
            //body('email').notEmpty().normalizeEmail().isEmail(),
            //body('password').isString().isLength({ min: 8}),
            //body('birthdate').exists().isISO8601(),
           // body('gender').notEmpty().isString(),
            //body('name').notEmpty().isString(),
            //body('family_name').notEmpty().isString()
          ]
        case 'signIn':
          return [
            body('phoneNumber').notEmpty().isLength({min: 9}),
            //body('password').isString().isLength({ min: 8}),
          ]
        case 'verify':
          return [
            body('userId').notEmpty().isLength({min: 5}),
            body('code').notEmpty().isString().isLength({min: 6, max: 6}),
            body('session').notEmpty().isString()

          ]
        case 'forgotPassword':
          return [
            body('username').notEmpty().isLength({ min: 5}),
          ]
        case 'confirmPassword':
          return [
            body('password').exists().isLength({ min: 8}),
            body('username').notEmpty().isLength({ min: 5}),
            body('code').notEmpty().isString().isLength({min: 6, max: 6})
          ]
        case 'accessToken':
          return [
            body('refreshToken').notEmpty().isString()
          ]
        case 'phoneType':
          return [
            body('phoneNumber').notEmpty().isString()
          ]
        
      }
    }
}

export default AuthController