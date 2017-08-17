"use strict";
let express = require('express');
let router = express.Router();
let passport = require('passport');
let Strategy = require('passport-facebook').Strategy;



passport.use(new Strategy(
    {
        clientId: "111171992898481",
        _clientSecret: "b10c301f2f377b3b6d856ebd1c6ea3c8",
        callback: 'http://localhost:3000/v3/auth/facebook/return'

    },
    function(accessToken, refreshToken, profile, cb){
        return cb(null, profile);
    }));


// Configure Passport authenticated session persistence
//
// In order to restore authentification state across HTTP requests, Passport
// needs to serialize users into and deserialize users out of the session. In a
// production-quality application, this would typically be as simple as supplying
// the user ID when serializing, and querying the user record by ID from the database
// when deserializing. However, due to the fact that this example does not have a database
// the complete Facebook profile is serialized and deseralized
passport.serializeUser(function(user, cb){
    cb(null, user);
});
passport.deserializeUser(function(obj, cb){
    cb(null, obj);
});

// Initialize passport and restore authentification state if any, from the session
router.use(passport.initialize());
router.use(passport.session());


router.get('/auth/', function(req, res, next){
    return res.send('Auth root route');
});

router.get('/auth/login', function(req, res, next){
    return res.send('Logging in the facebook');
});

router.get('/auth/login/facebook', function(req, res, next){
    return res.json({facebook: 'logging with facebook'});
});

router.get('/auth/facebook/login/facebook/return', function(req, res, next){
    return res.send('this is the return for the url')
});

router.get('/auth/facebook/profile', function (req, res, next) {
    return res.json({profile: "This is the profile info"});
});

module.exports = router;