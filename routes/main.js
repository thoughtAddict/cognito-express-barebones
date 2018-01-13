// =========================================
// Dependencies
// =========================================
const config     = require("../config")();
const Utils      = require("../services/Utils");
const CognitoSDK = require('amazon-cognito-identity-js-node');
const AWS        = require('aws-sdk');

// =========================================
// Routes
// =========================================
module.exports = function (app, cognitoExpress, cognitoUserPoolData) {

  app.use(function(req, res, next) {
    if ( typeof req.session !== 'undefined' ) {      

        cognitoExpress.validate(req.session.accessToken, function(err, response) {
          if ( typeof req.session.user === 'undefined' ) {
            req.session.user = {};
          }        
          req.session.user = response;             
          next();
        });
     
    } else {
      next();
    }
  });

  app.get("/", function (req, res) {
    res.render("index", {locals: {
      title: "Hello Home",
      user: Utils.getUserInfo(req, res)
    }});
  });

  app.get("/login", function(req, res){
    res.render("login", {locals: {
      title: "Login",
      message: "Welcome. Please sign in.",
      user: Utils.getUserInfo(req, res)
    }});
  });

  app.get("/signup", function(req, res){
    res.render("signup", {locals: {
      title: "Sign Up",
      message: "",
      user: Utils.getUserInfo(req, res)
    }});   
  });

  app.get("/forgotPassword", function(req, res){
    res.render("forgotPassword", {locals: {
      title: "Forgot Password",
      message: "",
      user: Utils.getUserInfo(req, res)
    }});   
  });

  app.get("/securePage", function(req, res){
    res.render("securePage", {locals: {
      title: "Secure Page",
      user: Utils.getUserInfo(req, res)
    }});  
  });

  app.get("/profile", function(req, res){

    let user = Utils.getUserInfo(req, res);
    
    if ( user.signedIn ) {
      res.render("profile", {locals: {
        title: "Your Account Profile",
        message: "Please enter your old and new passwords.",
        user: user
      }});  
    } else {
      res.render("login", {locals: {
        title: "Login",
        message: "Welcome. Please sign in.",
        user: user
      }});
    }  
  });

  app.post("/login", function(req, res){

    let username = typeof req.body.username === 'undefined' ? "" : req.body.username;
    let password = typeof req.body.password === 'undefined' ? "" : req.body.password;    

    let authenticationDetails = new CognitoSDK.AuthenticationDetails({
      Username : username,
      Password : password
    });

    let cognitoUserPool = new CognitoSDK.CognitoUserPool(cognitoUserPoolData);
    let userData = {
      Username: username,
      Pool: cognitoUserPool
    };
      
    let cognitoUser = new CognitoSDK.CognitoUser(userData);
      
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {

        req.session.accessToken = result.accessToken.jwtToken;
        req.session.idToken = result.idToken.jwtToken;
        req.session.refreshToken = result.refreshToken.token;
        req.session.username = cognitoUser.getUsername();

        let loginsKey = "cognito-idp." + config.AWS_REGION + ".amazonaws.com/" + config.USER_POOL_ID;
        let cognitoIdentityCredentials = {};
        cognitoIdentityCredentials.IdentityPoolId = config.IDENTITY_POOL_ID;
        cognitoIdentityCredentials.Logins = {};
        cognitoIdentityCredentials.Logins[loginsKey] = result.getIdToken().getJwtToken();
        AWS.config.credentials = new AWS.CognitoIdentityCredentials( cognitoIdentityCredentials );  

        AWS.config.credentials.get(function() {

          let cognitoSync = new AWS.CognitoSync();
      
          cognitoSync.listRecords({
            DatasetName: config.MAIN_DATASET_NAME, 
            IdentityId: cognitoSync.config.credentials.identityId,  
            IdentityPoolId: config.IDENTITY_POOL_ID
          }, function(err, data) {

            let dataRecords = [];
            if ( !err ) {

              req.session.syncSessionToken = data.SyncSessionToken;
              req.session.datasetSyncCount = data.DatasetSyncCount;
              dataRecords = data.Records;              
        
              console.log("============================ Data Records");      
              console.log(dataRecords);
              
            } else {
              console.log("ERR");
              console.log(err);
            }  
        
            res.render("index", {locals: {
              title: "Hello Home",
              user: Utils.getUserInfoFromLogin(cognitoUser, dataRecords, req, res)
            }});              
          });    
        });            
             
      },
      onFailure: function(err) {
        res.render("login", {locals: {
          title: "Login",
          message: Utils.errorMessage(err),
          user: Utils.getUserInfoFromLogin(cognitoUser, [], req, res)
        }});            
      }
      });
  });

  app.get("/logout", function(req, res){

    let cognitoUserPool = new CognitoSDK.CognitoUserPool(cognitoUserPoolData);

    let userData = {
      Username : req.session.username,
      Pool : cognitoUserPool
    };
    
    console.log("========================logout========================");
    console.log(userData);

    let cognitoUser = new CognitoSDK.CognitoUser(userData); 
      
    cognitoUser.getSession(function(err, result) {
      
      if (err) {
        console.log(err);
      } else {
          
        console.log("=====================signing out==================");
        cognitoUser.signOut();
      
        //res.clearCookie("idToken");
        //res.clearCookie("accessToken");
        //res.clearCookie("refreshToken");
        //res.clearCookie("SyncSessionToken");    
        //res.clearCookie("DatasetSyncCount");                
        //res.clearCookie("username");  
        
        req.session.destroy(function(err) {
          console.log("Session data has been destroyed.");
        })        
         
        res.render("login", {locals: {
          title: "Login",
          message: "You are now signed out.",
          user: Utils.getUserInfo(req, res)
        }});        
         
      }       
    });    
  });

  app.post("/changePassword", function(req, res){

    let oldPassword = typeof req.body.oldPassword === 'undefined' ? "" : req.body.oldPassword;    
    let newPassword = typeof req.body.newPassword === 'undefined' ? "" : req.body.newPassword;  

    let cognitoUserPool = new CognitoSDK.CognitoUserPool(cognitoUserPoolData);

    let userData = {
      Username : req.session.username,
      Pool : cognitoUserPool
    };
      
    let cognitoUser = new CognitoSDK.CognitoUser(userData); 
      
    cognitoUser.getSession(function(err, result) {
      
      if (err) {
        console.log(err);
      } else {
          
        cognitoUser.changePassword(oldPassword, newPassword, function(err, result) {
      
          if (err) {
            console.log(err);
          } else {
            res.render("profile", {locals: {
              title: "Your Account Profile",
              message: "Your password has been changed.",
              user: Utils.getUserInfo(req, res)
            }});         
          }       
        });        
         
      }       
    });    
  });

  app.post("/forgotPassword", function(req, res){

    let username = typeof req.body.username === 'undefined' ? "" : req.body.username;

    let cognitoUserPool = new CognitoSDK.CognitoUserPool(cognitoUserPoolData);

    let userData = {
      Username : username,
      Pool : cognitoUserPool
    };
      
    let cognitoUser = new CognitoSDK.CognitoUser(userData); 
      
    cognitoUser.forgotPassword({
      onSuccess: function (data) {
        console.log('CodeDeliveryData from forgotPassword: ');
        console.log(data);      
      },
      onFailure: function(err) {
        console.log(err);
      },
      inputVerificationCode: function(data) {
      
        req.session.username = cognitoUser.getUsername();

        console.log('Code sent to: ');
        console.log(data);  
          
        res.render("confirmPassword", {locals: {
          title: "Create New Password",
          message: "",
          user: Utils.getUserInfo(req, res)
        }});
      }
    });       
      
  });

  app.post("/confirmPassword", function(req, res){

    let newPassword = typeof req.body.password === 'undefined' ? "" : req.body.password;  
    let confirmCode = typeof req.body.confirmCode === 'undefined' ? "" : req.body.confirmCode;
    let username = req.session.username;

    let cognitoUserPool = new CognitoSDK.CognitoUserPool(cognitoUserPoolData);

    let userData = {
      Username : username,
      Pool : cognitoUserPool
    };

    let cognitoUser = new CognitoSDK.CognitoUser(userData);
    cognitoUser.confirmPassword(confirmCode, newPassword, {
      onSuccess: function (data) {
        res.render("login", {locals: {
          title: "Login",
          message: "Please sign in with your new password.",
          user: Utils.getUserInfo(req, res)
        }});     
      },
      onFailure: function(err) {
        console.log(err);
      }
    });   
  });

  app.post("/signup", function(req, res){

    let username = typeof req.body.username === 'undefined' ? "" : req.body.username;
    let email    = typeof req.body.email === 'undefined' ? "" : req.body.email;
    let password = typeof req.body.password === 'undefined' ? "" : req.body.password;
    let plan     = typeof req.body.plan === 'undefined' ? "" : req.body.plan;          

    let attributeList = [];
    let attributeEmail = new CognitoSDK.CognitoUserAttribute("email", email);   
    attributeList.push(attributeEmail);  
    //let attributeName = new CognitoSDK.CognitoUserAttribute("name", "Dingus");  
    //attributeList.push(attributeName);
      
    let cognitoUserPool = new CognitoSDK.CognitoUserPool(cognitoUserPoolData);

    cognitoUserPool.signUp(username, password, attributeList, null, function(err, result){
 
      if (err) {
        res.render("signup", {locals: {
          title: "Sign Up",
          message: Utils.errorMessage(err),
          user: Utils.getUserInfo(req, res)
        }});       
      } else {
                 
        cognitoUser = result.user;
        console.log('user name is ' + cognitoUser.getUsername());
        req.session.username = cognitoUser.getUsername();
        req.session.plan = plan;
      
        res.render("confirm", {locals: {
          title: "Please Confirm",
          username: cognitoUser.getUsername(),
          message: "Please enter the verification code you received in your email.",        
          user: Utils.getUserInfo(req, res)
        }});  
  
      }
    });   
  });

  app.post("/confirm", function(req, res){

    let cognitoUserPool = new CognitoSDK.CognitoUserPool(cognitoUserPoolData);

    let confirmCode = typeof req.body.confirmCode === 'undefined' ? "" : req.body.confirmCode;
    let username = req.session.username;

    let userData = {
      Username : username,
      Pool : cognitoUserPool
    };

    let cognitoUser = new CognitoSDK.CognitoUser(userData);
    cognitoUser.confirmRegistration(confirmCode, true, function(err, result) {
      
      if (err) {
      
        console.log("ERROR HERE");
        console.log(err);
        console.log(cognitoUser.getUsername());
        
        res.render("confirm", {locals: {
          title: "Please Confirm",
          username: cognitoUser.getUsername(),
          message: Utils.errorMessage(err),        
          user: Utils.getUserInfo(req, res)
        }});      

      } else {
      
        let plan = req.session.plan;   
        console.log('call result: ' + result);
        console.log('plan: ' + plan);
        
        let cognitoSync = new AWS.CognitoSync();    
        console.log("==================================== cognitoSync");        
        console.log(cognitoSync);    

        console.log("CHECK: cognitoSync.config.credentials.identityId");
        console.log(cognitoSync.config.credentials.identityId);      
        // Need to figure out how/where to cognitoSync.updateRecords upon new registration.
        
          
        res.render("login", {locals: {
          title: "Login",
          message: "Please sign in with your new account.",
          user: Utils.getUserInfo(req, res)
        }});  
      }      
    });   
  });
  app.get("/saveRecord", function(req, res){

    AWS.config.credentials.get(function() {

      let cognitoSync = new AWS.CognitoSync();    
      console.log("==================================== cognitoSync");        
      console.log(cognitoSync);    

      console.log("cognitoSync.config.credentials.identityId");
      console.log(cognitoSync.config.credentials.identityId);

      let syncSessionToken = req.session.syncSessionToken;
      let datasetSyncCount = req.session.datasetSyncCount;

      console.log(syncSessionToken);
      console.log(datasetSyncCount);    
      
      let params = {
        DatasetName: config.MAIN_DATASET_NAME,
        IdentityId: cognitoSync.config.credentials.identityId, 
        IdentityPoolId: config.IDENTITY_POOL_ID, 
        SyncSessionToken: syncSessionToken, 
        RecordPatches: [
          {
            Key: 'accessPermissions', 
            Op: 'replace',
            SyncCount: datasetSyncCount,
            Value: "*"
          }
        ]
      };
      
      cognitoSync.updateRecords(params, function(err, data) {
      
        if (err) {
          console.log("SAVE ERR");
          console.log(err); 
        } else {
          console.log("SAVE SUCCESS");
          console.log(JSON.stringify(data)); 
        }
      });      
    });
  });
  
};
