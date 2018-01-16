// =========================================
// Dependencies
// =========================================
const express      = require('express');
const session      = require('express-session');
const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const engine       = require("ejs-locals");
const app          = express();
const config       = require('./config')();
const jwtDecode    = require('jwt-decode');
const http         = require('http').createServer(app);
const io           = require("socket.io")(http);

// =========================================
// AWS Cognito
// =========================================
const AWS = require('aws-sdk');
require('amazon-cognito-js');
const CognitoSDK     = require('amazon-cognito-identity-js-node');
const CognitoExpress = require("cognito-express");

AWS.config.region = config.AWS_REGION;
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: config.IDENTITY_POOL_ID,
});

const cognitoUserPoolData = {
  UserPoolId : config.USER_POOL_ID,
  ClientId : config.APP_CLIENT_ID
};

const cognitoExpress = new CognitoExpress({
  region: config.AWS_REGION,
  cognitoUserPoolId: config.USER_POOL_ID,
  tokenUse: config.COGNITO_TOKEN_USE,
  tokenExpiration: config.COGNITO_TOKEN_EXPIRATION
});

// =========================================
// Cookie and Body initialization
// =========================================
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// =========================================
// Application Configuration
// =========================================
app.use(session({ 
  secret: config.APP_SESSION_SECRET,
  key: config.APP_SESSION_KEY,
  saveUninitialized: true, 
  resave: true 
}));

app.engine("ejs", engine);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// =========================================
// Application Routes
// =========================================
require("./routes/main")(app, cognitoExpress, cognitoUserPoolData);

// =========================================
// Socket IO Bindings
// =========================================
io.on("connection", function(client){

	let clientId = client.id;
	let clientIP = client.request.connection.remoteAddress;
	console.log("======User (" + clientId + ") connected. (" + clientIP + ")");

	client.on("disconnect", function(){
		console.log("------User (" + clientId + ") disconnected. (" + clientIP + ")");
	});

	client.on("resendConfirmation", function(data) {

    let cognitoUserPool = new CognitoSDK.CognitoUserPool(cognitoUserPoolData);
    let cognitoUser = new CognitoSDK.CognitoUser({
      Username : data.username,
      Pool : cognitoUserPool
    });
    
    cognitoUser.resendConfirmationCode(function(err, result) {
    
        if (err) {
            console.log(err);
        }
        io.to(clientId).emit("resendConfirmationResult", data);
    });   
	});
});

// =========================================
// Listen...
// =========================================
http.listen(config.SERVER_PORT, config.SERVER_IP);
console.log("Listening on " + config.SERVER_IP + ":" + config.SERVER_PORT);
