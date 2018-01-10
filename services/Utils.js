// =========================================
// Dependencies
// =========================================
const jwtDecode = require('jwt-decode');

// =========================================
// Functions
// =========================================
module.exports = {

  getUserInfo: function(req, res) {

	  let userAttr = {};
	  if ( typeof req.cookies !== 'undefined' ) {
		  userAttr = typeof req.cookies.idToken !== 'undefined' ? jwtDecode(req.cookies.idToken) : {};
	  }
	
	  if ( typeof req.session !== 'undefined' ) {
	
      if ( typeof req.session.user === 'undefined' || req.session.user === null ) {
        req.session.user = {};
        req.session.user.token_use = ""; 
        req.session.user.username = ""; 
        req.session.user.signedIn = false;		
      } else {
        req.session.user.signedIn = true;
      }
	    req.session.user.attr = userAttr;
	    
	    console.log("==========req.session.user===============");
	    console.log("=========================================");	  
	    console.log(req.session.user);
	    console.log(req.session.access);	  	  
	    console.log("=========================================");	  	  
	
      return req.session.user;
      
    } else {
      return {};
    }     
  },

  getUserInfoFromLogin: function(cognitoUser, dataRecords, req, res) {

	  console.log("==============dataRecords================");
	  console.log("=========================================");	  
	  console.log(dataRecords);
	  console.log("=========================================");
	  
	  if ( typeof req.session !== 'undefined' ) {	  

      if ( typeof cognitoUser === 'undefined' || cognitoUser === null ) {
        req.session.user = {};
        req.session.user.token_use = ""; 
        req.session.user.username = ""; 
        req.session.user.signedIn = false;
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

	    console.log("==========req.session.user==login========");
	    console.log("=========================================");	  
	    console.log(req.session.user);
	    console.log(req.session.access);	  
	    console.log("=========================================");    
      
      return req.session.user;
      
    } else {
      return {};
    }      
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
