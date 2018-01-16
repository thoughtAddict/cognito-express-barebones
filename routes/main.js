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
    Utils.login(username, password, cognitoUserPoolData, req, res); 
  });

  app.get("/logout", function(req, res){
    Utils.logout(cognitoUserPoolData, req, res);       
  });

  app.post("/changePassword", function(req, res){
    let oldPassword = typeof req.body.oldPassword === 'undefined' ? "" : req.body.oldPassword;    
    let newPassword = typeof req.body.newPassword === 'undefined' ? "" : req.body.newPassword;  
    Utils.changePassword(oldPassword, newPassword, cognitoUserPoolData, req, res);
  });

  app.post("/forgotPassword", function(req, res){
    let username = typeof req.body.username === 'undefined' ? "" : req.body.username;
    Utils.forgotPassword(username, cognitoUserPoolData, req, res);  
  });

  app.post("/confirmPassword", function(req, res){
    let newPassword = typeof req.body.password === 'undefined' ? "" : req.body.password;  
    let confirmCode = typeof req.body.confirmCode === 'undefined' ? "" : req.body.confirmCode;
    Utils.confirmPassword(newPassword, confirmCode, cognitoUserPoolData, req, res);
  });

  app.post("/signup", function(req, res){
    let username = typeof req.body.username === 'undefined' ? "" : req.body.username;
    let email    = typeof req.body.email === 'undefined' ? "" : req.body.email;
    let password = typeof req.body.password === 'undefined' ? "" : req.body.password;
    let plan     = typeof req.body.plan === 'undefined' ? "" : req.body.plan;          
    Utils.signup(username, email, password, plan, cognitoUserPoolData, req, res);
  });

  app.post("/confirm", function(req, res){
    let confirmCode = typeof req.body.confirmCode === 'undefined' ? "" : req.body.confirmCode;    
    Utils.confirm(confirmCode, cognitoUserPoolData, req, res); 
  });
  
};
