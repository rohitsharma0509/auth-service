module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    "<rootDir>/src/exception/*.*"
],
  testPathIgnorePatterns: [".d.ts", ".js"]
};

process.env = Object.assign(process.env, { COGNITO_REGION: 'region',
      COGNITO_USER_POOLID: 'pool_id',
      COGNITO_CLIENT_ID: 'client_id',
      SECRETS_PATH: 'secret_path'});