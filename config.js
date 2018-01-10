const environment = process.env.NODE_ENV || 'development';

module.exports = function () {

    if (environment === 'development') {
        return {
          USER_POOL_ID: "<<YOUR USER POOL ID>>",
          APP_CLIENT_ID: "<<YOUR APP CLIENT ID>>",
          IDENTITY_POOL_ID: "<<YOUR IDENTITY POOL ID>>",
          AWS_REGION: "<<YOUR REGION>>",
          COGNITO_TOKEN_USE: "access",
          COGNITO_TOKEN_EXPIRATION: 3600000,
          APP_SESSION_SECRET: "THISISASECRET",
          APP_SESSION_KEY: "NAMEOFCOOKIEFORTHISAPP",
          MAIN_DATASET_NAME: "main_DS",
          SERVER_PORT: 3000,
          SERVER_IP: "0.0.0.0"
        };
    } else if (environment === 'production') {
        return {
          USER_POOL_ID: "<<YOUR USER POOL ID>>",
          APP_CLIENT_ID: "<<YOUR APP CLIENT ID>>",
          IDENTITY_POOL_ID: "<<YOUR IDENTITY POOL ID>>",
          AWS_REGION: "<<YOUR REGION>>",
          COGNITO_TOKEN_USE: "access",
          COGNITO_TOKEN_EXPIRATION: 3600000,
          APP_SESSION_SECRET: "THISISASECRET",
          APP_SESSION_KEY: "NAMEOFCOOKIEFORTHISAPP",          
          MAIN_DATASET_NAME: "main_DS",
          SERVER_PORT: 3000,
          SERVER_IP: "0.0.0.0"
        };
    }
};
