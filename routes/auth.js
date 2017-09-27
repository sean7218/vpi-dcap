"use strict";
let express = require('express');
let router = express.Router();
let passport = require('passport');
let Strategy = require('passport-facebook').Strategy;


// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy(
    {
        clientID: "111171992898481",
        clientSecret: "b10c301f2f377b3b6d856ebd1c6ea3c8",
        callbackURL: 'http://localhost:3000/auth/login/facebook/return',
        profileFields: ['id','email', 'displayName', 'photos', 'gender','link']

    },
    function(accessToken, refreshToken, profile, cb){
        // In this example, the user's Facebook profile is supplied as the user
        // record.  In a production-quality application, the Facebook profile should
        // be associated with a user record in the application's database, which
        // allows for account linking and authentication with other identity
        // providers.
        console.log("accessToken: " + accessToken);
        console.log("refreshToken: " + refreshToken);
        console.log("profileName: "+ profile);
        console.log("profileEmail: "+ Object.keys(profile));
        console.log("profileUrl: " + profile['id']);
        console.log("photo: " + profile['displayName']);
        console.log("profileUrl: " + profile.photos);
        console.log("json: " + profile['_json']);
        console.log("jsonKrys: " + Object.keys(profile['_json']));
        console.log("_raw: " + profile['_raw']);
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

// Initialize Passport and restore authentication state, if any, from the
// session.
router.use(passport.initialize());
router.use(passport.session());

router.get('/', function(req, res, next){
    return res.send('Homepage for the auth');
});

router.get('/login', function(req, res, next){
    console.log("Authenticated Status: " + req.isAuthenticated());
    return res.render('loginSocial');
});

router.get('/login/facebook',
    passport.authenticate('facebook', { scope: ['user_friends', 'manage_pages', 'user_likes', 'email'] })
);

router.get('/login/facebook/return',
    passport.authenticate('facebook', { failureRedirect: '/' }),
    function (req, res) {
        console.log("Authenticated Status: " + req.isAuthenticated());
        res.redirect('/auth');
    });

router.get('/logout', function (req, res) {
    req.logOut();
    console.log("Authenticated Status: " + req.isAuthenticated());
    res.send("loggedout");
});

router.get('/error', function(req, res){
    res.send("Sorry you do not have the access to this page");
});

router.get('/intranet',
    function(req, res, next) {
        if(req.isAuthenticated()){
            return next();
        } else {
            res.send("Not Authorized")
        }
    },
    function(req, res){
    res.send("This is the intranet");
});
router.get('/profile',
    require('connect-ensure-login').ensureLoggedIn({ redirectTo: '/auth/login'}),
    function (req, res) {

    return res.json({ profile: req.user});
});

module.exports = router;