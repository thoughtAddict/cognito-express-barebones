# cognito-express-barebones

Barebones NodeJS/Express application that uses the AWS Cognito service on the server side.

## Introduction

Mid-2017 I searched for a server-side solution for accessing the AWS Cognito service.  After finding numerous tutorials, AWS documentation sites, and blog posts, each centering around Cognito, I found that they all expected the code to run on the client side.

I either couldn't find a complete solution, or the documentation was dated, incorrect, or not functional.

## Still working on it...  almost complete and in "testing".

This project is the result of those many hours of finding bits and pieces of what I need to get Cognito accessible via a NodeJS/Express server.

This project uses:

* kndt84/amazon-cognito-identity-js
    * https://github.com/kndt84/amazon-cognito-identity-js
* ghdna/cognito-express     
    * https://github.com/ghdna/cognito-express
* aws/aws-sdk-js
    * https://github.com/aws/aws-sdk-js
* AWS User Pool
* AWS Federated Identity

It is very much a work-in-progress...

When all is complete, this will be a full-fledged, barebones Express app that will include:

### Currently in Testing

- [x] Use of a single Cognito User Pool and how to connect/config. 
- [x] Use of a single Cognito Federated ID Pool and how to connect/config. 
- [x] Sign Up / Registration page, using an email address as the username. 
- [x] Forgot Password 
- [x] Change Password 
- [x] How to use the Tokens to determine if the user is signed on or not. 
- [x] How to save the Tokens that are returned from the Cognito service.
- [x] Private (Secure) Page example(s) - (There's 1 but need more)
- [x] Public Page examples(s) - (There's 1 but need more)
- [x] Logout 
- [x] Resend Confirmation Email

### Currently in Development

- [ ] Confirmation of Sign Up / Registration after receiving a confimation # via email. 
- [ ] UI improvements (ie.  Let's use some CSS, shall we?)


### Config.js

Example:

```
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
          APP_SESSION_SECRET: "THIS_IS_A_SECRET",
          APP_SESSION_KEY: "NAME_OF_COOKIE_FOR_THIS_APP",
          MAIN_DATASET_NAME: "main_DS",
          NEW_SIGNUP_STATUS: "NEW_SIGNUP",
          COMPLETE_SIGNUP_STATUS: "REGISTRATION_COMPLETED",
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
          APP_SESSION_SECRET: "THIS_IS_A_SECRET",
          APP_SESSION_KEY: "NAME_OF_COOKIE_FOR_THIS_APP",          
          MAIN_DATASET_NAME: "main_DS",
          NEW_SIGNUP_STATUS: "NEW_SIGNUP",
          COMPLETE_SIGNUP_STATUS: "REGISTRATION_COMPLETED",
          SERVER_PORT: 3000,
          SERVER_IP: "0.0.0.0"
        };
    }
};
```

