// =========================================
// Dependencies
// =========================================
const config     = require("../config")();
const jwtDecode  = require('jwt-decode');
const CognitoSDK = require('amazon-cognito-identity-js-node');
const AWS        = require('aws-sdk');

// =========================================
// Functions
// =========================================
module.exports = {

  getUserInfo: function(req, res) {

	  if ( typeof req.session !== 'undefined' ) {
	
      if ( typeof req.session.user === 'undefined' || req.session.user === null ) {
        req.session.user = {};
        req.session.user.token_use = ""; 
        req.session.user.username = ""; 
        req.session.user.signedIn = false;		
      } else {
        req.session.user.signedIn = true;
      }
        
	    let userAttr = {};
	    if ( typeof req.cookies !== 'undefined' ) {
		    userAttr = typeof req.cookies.idToken !== 'undefined' ? jwtDecode(req.cookies.idToken) : {};
	    }            
	    req.session.user.attr = userAttr;
	    
      return req.session.user;
      
    } else {
      return {};
    }     
  },

  getUserInfoFromLogin: function(cognitoUser, dataRecords, req, res) {

	  if ( typeof req.session !== 'undefined' ) {	  

      if ( typeof cognitoUser === 'undefined' || cognitoUser === null ) {
        req.session.user = {};
        req.session.user.token_use = ""; 
        req.session.user.username = ""; 
        req.session.user.signedIn = false;
        req.session.access = {};
      } else {
      
        req.session.user = {};
        req.session.user.token_use = "access"; 
        req.session.user.username = typeof cognitoUser.username !== 'undefined' ? cognitoUser.username : "Guest";   
        req.session.user.signedIn = true;              
        req.session.access = {};
        
        if ( typeof dataRecords !== 'undefined' ) {
          for (let index = 0; index < dataRecords.length; index++ ) {
            let record = dataRecords[index];
            let key =  typeof record.Key !== 'undefined' ? record.Key : "";    
            if ( key !== "" ) {
              let value = typeof record.Value !== 'undefined' ? record.Value : "";
              req.session.access[key] = value;              
            }
          }          
        }    
      }

      return req.session.user;
      
    } else {
      return {};
    }      
  },
  
  getCognitoUser: function(username, cognitoUserPoolData) {

    let cognitoUserPool = new CognitoSDK.CognitoUserPool(cognitoUserPoolData);
    let userData = {
      Username: username,
      Pool: cognitoUserPool
    };
      
    return new CognitoSDK.CognitoUser(userData);  
  },
  
  login: function(username, password, cognitoUserPoolData, req, res) {

    let thisUtils = this;
  
    let authenticationDetails = new CognitoSDK.AuthenticationDetails({
      Username : username,
      Password : password
    });

    let cognitoUser = thisUtils.getCognitoUser(username, cognitoUserPoolData);
      
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

            if ( !err ) {
            
              req.session.syncSessionToken = data.SyncSessionToken;
              req.session.datasetSyncCount = data.DatasetSyncCount;

              if ( typeof req.session.status !== 'undefined' && req.session.status === config.NEW_SIGNUP_STATUS ) {
                
                console.log("NEW SIGN UP");                
                let params = {
                  DatasetName: config.MAIN_DATASET_NAME,
                  IdentityId: cognitoSync.config.credentials.identityId, 
                  IdentityPoolId: config.IDENTITY_POOL_ID, 
                  SyncSessionToken: data.SyncSessionToken, 
                  RecordPatches: [
                    {
                      Key: 'accessPermissions', 
                      Op: 'replace',
                      SyncCount: data.DatasetSyncCount,
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
                    req.session.status = config.COMPLETE_SIGNUP_STATUS;
                    
                    res.render("index", {locals: {
                      title: "Home",
                      user: thisUtils.getUserInfoFromLogin(cognitoUser, data.Records, req, res)
                    }});                                      
                  }
                });                 
              
              } else {             
                console.log("EXISTING LOGIN");    
                res.render("index", {locals: {
                  title: "Home",
                  user: thisUtils.getUserInfoFromLogin(cognitoUser, data.Records, req, res)
                }});                                                     
              }             
                   
            } else {
              console.log("ERR");
              console.log(err);
              // TODO:  Need res.render for cases where "err".
            }      
          });
        });          

      },
      onFailure: function(err) {
        res.render("login", {locals: {
          title: "Login",
          message: thisUtils.errorMessage(err),
          user: thisUtils.getUserInfoFromLogin(cognitoUser, [], req, res)
        }});            
      }
      });  
  },
  
  logout: function(cognitoUserPoolData, req, res) {
  
    let thisUtils = this;  
    let cognitoUser = thisUtils.getCognitoUser(req.session.username, cognitoUserPoolData);
      
    cognitoUser.getSession(function(err, result) {
      
      if (err) {
        console.log(err);
      } else {
          
        cognitoUser.signOut();
        req.session.destroy(function(err) {
          console.log("Session data has been destroyed.");
        })        
         
        res.render("login", {locals: {
          title: "Login",
          message: "You are now signed out.",
          user: thisUtils.getUserInfo(req, res)
        }});
      }       
    });   
  
  },
  
  changePassword: function(oldPassword, newPassword, cognitoUserPoolData, req, res) {
  
    let thisUtils = this;    
    let cognitoUser = thisUtils.getCognitoUser(req.session.username, cognitoUserPoolData);
      
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
              user: thisUtils.getUserInfo(req, res)
            }});         
          }       
        });         
      }       
    });  
  
  },
  
  forgotPassword: function(username, cognitoUserPoolData, req, res) {
  
    let thisUtils = this;    
    let cognitoUser = thisUtils.getCognitoUser(username, cognitoUserPoolData);
      
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
          user: thisUtils.getUserInfo(req, res)
        }});
      }
    });        
  
  },
  
  confirmPassword: function(newPassword, confirmCode, cognitoUserPoolData, req, res) {
  
    let thisUtils = this;    
    let cognitoUser = thisUtils.getCognitoUser(req.session.username, cognitoUserPoolData);
    
    cognitoUser.confirmPassword(confirmCode, newPassword, {
      onSuccess: function (data) {
        res.render("login", {locals: {
          title: "Login",
          message: "Please sign in with your new password.",
          user: thisUtils.getUserInfo(req, res)
        }});     
      },
      onFailure: function(err) {
        console.log(err);
      }
    });      
  
  },
  
  signup: function(username, email, password, plan, cognitoUserPoolData, req, res) {
  
    let thisUtils = this;    
    let cognitoUserPool = new CognitoSDK.CognitoUserPool(cognitoUserPoolData);
        
    let attributeList = [];
    attributeList.push( new CognitoSDK.CognitoUserAttribute("email", email) );  

    cognitoUserPool.signUp(username, password, attributeList, null, function(err, result){

      if (err) {
        res.render("signup", {locals: {
          title: "Sign Up",
          message: thisUtils.errorMessage(err),
          user: thisUtils.getUserInfo(req, res)
        }});       
      } else {
                 
        cognitoUser = result.user;
        req.session.username = cognitoUser.getUsername();
        req.session.plan = plan;
        req.session.status = config.NEW_SIGNUP_STATUS;
      
        res.render("confirm", {locals: {
          title: "Please Confirm",
          username: cognitoUser.getUsername(),
          message: "Please enter the verification code you received in your email.",        
          user: thisUtils.getUserInfo(req, res)
        }});  
  
      }
    });      

  },
  
  confirm: function(confirmCode, cognitoUserPoolData, req, res) {
  
    let thisUtils = this;    
    let cognitoUser = thisUtils.getCognitoUser(req.session.username, cognitoUserPoolData);

    cognitoUser.confirmRegistration(confirmCode, true, function(err, result) {

      if (err) {
        res.render("confirm", {locals: {
          title: "Please Confirm",
          username: cognitoUser.getUsername(),
          message: thisUtils.errorMessage(err),        
          user: thisUtils.getUserInfo(req, res)
        }});      
      } else {
        res.render("login", {locals: {
          title: "Login",
          message: "Please sign in with your new account.",
          user: thisUtils.getUserInfo(req, res)
        }});  
      }      
    });     

  },

  errorMessage: function(err) {
    
    let message = "";                  
    let errCode = "";
    let errMessage = "";
    if (err) { 
      errCode = err.code; 
      errMessage = err.message;
    }

    if ( errCode === "UserNotFoundException" ) {
      message = "Invalid username.  Please try again.";
    } else if ( errCode === "NotAuthorizedException" ) {
      message = "Invalid password.  Please try again."; 
    } else if ( errCode === "InvalidPasswordException" ) {
      message = errMessage;
    } else if ( errCode === "InvalidParameterException" ) {
      message = errMessage;
    } else if ( errCode === "CodeMismatchException" ) {
      message = errMessage;             
    } else if ( errCode === "UsernameExistsException" ) {
      message = "This user name already exists."; 
    } else {
      message = "An unknown error has occurred.  Please contact Bob.  He knows how to fix everything.";
    }

    return message;
  },

	isNumeric: function(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	},

	isArray: function(obj) {
		return Object.prototype.toString.call(obj) == "[object Array]";
	},
	
	ipAddressToInteger: function(ip) {
	
		let thisUtils = this;
		let ipInteger = -1;
	
		try {
		
      let ipSegments = ip.split(".");
      if ( ipSegments.length == 4 ) {

        if ( thisUtils.isNumeric( ipSegments[0] ) && 
          thisUtils.isNumeric( ipSegments[1] ) && 
          thisUtils.isNumeric( ipSegments[2] ) && 
          thisUtils.isNumeric( ipSegments[3] ) ) {

          let seg0 = parseInt( ipSegments[0] );
          let seg1 = parseInt( ipSegments[1] );
          let seg2 = parseInt( ipSegments[2] );
          let seg3 = parseInt( ipSegments[3] );
          ipInteger = (seg0*Math.pow(256,3)) + (seg1*Math.pow(256,2)) + (seg2*256) + (seg3); 				    
        } else {
          ipInteger = -2;
        }
      }

		} catch(err) {
			console.log(err);
			ipInteger = -1;
		}

		return ipInteger;
	}	
};	
