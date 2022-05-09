import App from './app'

import * as bodyParser from 'body-parser'
const fs = require('fs');
import mongoose from 'mongoose';
import HomeController from './controllers/home.controller'
import AuthController from './controllers/auth.controller'
import ProtectedController from './controllers/protected.controller';
import MetricsController from './controllers/metrics.controller';
import { exit } from 'process';

import express, {NextFunction, Request, Response } from 'express'
const expressWinston = require('express-winston');
const winston = require('winston');
require('dotenv').config();

if(!process.env.COGNITO_REGION){
    console.error('cognito region is not set');
    exit();

}
if(!process.env.COGNITO_CLIENT_ID){
    console.error('cognito client not set');
    exit();

}

if(!process.env.COGNITO_USER_POOLID){
    console.error('cognito pool id is not set');
    exit();

}

if(!process.env.MONGO_DB_NAME){
  console.error('Mongo db name is not set');
  exit();

}

if(!process.env.SECRETS_PATH){
  console.error('Secrets path is not set');
  exit();

}




var PORT:number = Number(process.env.PORT).valueOf() || 3000;

// Mongodb conneection 
const connectMongodb = (mongoUser, mongopass, mongoUri, baseurl, dbName) => {
  const db_url = `${baseurl}://${mongoUser}:${mongopass}@${mongoUri}`;
  mongoose.connect(db_url, {useNewUrlParser: true,useUnifiedTopology: true, dbName: dbName, autoCreate: true, autoIndex: true})
  .then((conn)=>{
    console.log("******* mongodb is connected *******");
  }).catch((error)=>{
    console.log("$$$$$$$$ mondb not connected $$$$$$$$");
    console.log(error);
    exit(1);
  });
}

// read user name password and mongodb url from the file 
const getCrDetails = () => {
  const bastPath = process.env.SECRETS_PATH;
  const fileList = [`${bastPath}/MONGO_USERNAME`, `${bastPath}/MONGO_PASSWORD`, `${bastPath}/MONGO_CLUSTER_URL`];
  let res = [];
  let mongoUser = '';
  let mongopass = '';
  let mongoUri = '';
  let mongoDbName = process.env.MONGO_DB_NAME;
  let resObj = {}

  const readAllSecretsFile = fileList.map( _path => {
    return new Promise(function(_path, resolve, reject){
        fs.readFile(_path, 'utf8', function(err, data){
            if(err){
              console.log(err);
              resolve(""); 
            }else{
              resolve({_path, data});
            }
        });
    }.bind(this, _path));
  });

  return Promise.all(readAllSecretsFile).then(function(results) {
    results.forEach(function({_path, data}){
      res.push({_path, data});    
    });

    res.map(({_path, data}) => {
      if(_path === `${bastPath}/MONGO_USERNAME`) {
        mongoUser = data
      }
      if(_path === `${bastPath}/MONGO_PASSWORD`) {
        mongopass = data
      }
      if(_path === `${bastPath}/MONGO_CLUSTER_URL`) {
        mongoUri = data
      }
    });
    return {
      mongoUser,
      mongopass,
      mongoUri,
      mongoDbName
    };
  });
}

// Connect to mongodb
(async () => {
  if (process.env.ENV === 'local') {
    const {mongoUser, mongopass, mongoUri, mongoDbName} = await getCrDetails();
    connectMongodb(mongoUser, mongopass, mongoUri, 'mongodb+srv', mongoDbName);
  } else {
    const {mongoUser, mongopass, mongoUri, mongoDbName} = await getCrDetails();
    connectMongodb(mongoUser, mongopass, mongoUri, 'mongodb', mongoDbName);
  }
})();

const logger = new winston.createLogger({
    transports: [
      new winston.transports.Console({ 
        level:            'debug', 
        handleExceptions: true, 
        json:             false, 
        colorize:         true 
      }) 
    ], 
    exitOnError: false 
  });
  logger.stream = { 
    write: function(message, encoding){ 
      logger.info(message); 
    } 
  };

const app = new App({
    port: PORT,
    controllers: [
        new HomeController(),
        new AuthController(),
        new ProtectedController(),
        new MetricsController()
    ],
    middleWares: [
      // parse application/json
      // parse application/x-www-form-urlencoded
        bodyParser.json(),
        bodyParser.urlencoded({ extended: true }),
        expressWinston.logger({
            transports: [
              new winston.transports.Console({
                json: true,
                colorize: true
              })
            ]
          }),
        function errorHandler(
                  err: unknown,
                  req: Request,
                  res: Response,
                  next: NextFunction
                ): Response | void {
                  if (err instanceof Error) {
                    console.error(err);
                    return res.status(400).json({
                      message: err,
                    });
                  }

                  next();
                },  

        
    ]
})

app.listen()
