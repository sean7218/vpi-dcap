"use strict";

let express = require('express');
let router = express.Router();
let jwt = require('jsonwebtoken');
let passport = require('passport');
let Strategy = require('passport-facebook').Strategy;
let connect = require('connect-ensure-login').ensureLoggedIn();
let gToken = null;
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
        callbackURL: 'http://localhost:3000/fb/login/return',
        profileFields: ['id','email', 'displayName', 'photos', 'gender']

    }, 
    function(accessToken, refreshToken, profile, cb){
        // In this example, the user's Facebook profile is supplied as the user
        // record.  In a production-quality application, the Facebook profile should
        // be associated with a user record in the application's database, which
        // allows for account linking and authentication with other identity
        // providers.
        console.log(1)
        console.log("\naccessToken: " + accessToken)
        console.log("\nprofile: " + profile.id)
        console.log("\nname: " + profile.displayName)
        // Following code will generate jwt once it has been verified with the database
        // record, key values will included inside of the 
        let unsignToken = {
            accessToken: accessToken,
            refreshToken: refreshToken,
            name: profile.displayName
        };
        // the global token should be saved inside the session database
        gToken = jwt.sign(unsignToken, "superSecret", { expiresIn: 60*60 });
        return cb(null, profile, gToken);
    }
));

// Configure Passport authenticated session persistence
//  
// In order to restore authentification state across HTTP requests, Passport
// needs to serialize users into and deserialize users out of the session. In a
// production-quality application, this would typically be as simple as supplying
// the user ID when serializing, and querying the user record by ID from the database
// when deserializing. However, due to the fact that this example does not have a database
// the complete Facebook profile is serialized and deseralized
passport.serializeUser(function(user, cb){
    console.log(3)
    cb(null, user);
});
passport.deserializeUser(function(obj, cb){
    console.log(4)
    cb(null, obj);
});

// Initialize Passport and restore authentication state, if any, from the
// session.
router.use(passport.initialize());
router.use(passport.session());

// fake token that can be used during development
var token = jwt.sign({
    "name": "sean7218",
    "email":"sean7218@gmail.com"
  },
  "superSecret",
  {
    expiresIn: 60*60 // expires in 24 hours
  })

router.route("/").get( function(req, res, next){
    res.send("Please login using fb/login")
})

router.route("/login").get( function(req, res, next){
        console.log("Facebook Status: " + req.isAuthenticated())
        next();
    },
    passport.authenticate('facebook', {scope: ['email'], session: true })
)

router.route("/login/return").get(
    passport.authenticate('facebook', { failureRedirect: "/fb/"}), 
    function(req, res, next){
        
        console.log(2)
        // if authentification has done correctly then give user the token
        res.json({
            success: true,
            message: "Enjoy your token",
            token: gToken,
            sessionID: req.session['passport'],
            authen: req.isAuthenticated(),
            accessToken: req.session.cookie,
            authInfo: req.authInfo
        })
})

router.route("/logout").get(function(req, res, next) {
    req.logout()
    res.send("Successfully Logout")
})

router.route("/data").get(verify, function(req,res,next){
    res.send("Yes I have got the data, the super secret data!")
})

function verify(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode the token
    if (token){

        // verify secret and checks exp
        jwt.verify(token, "superSecret", function(err, decoded){
            if(err){
                res.json({ success: false, message: 'Failed to authenticate token'})
                print(err)
            } else {
                // if everything good, save to request for use in other routes
                req.decoded = decoded
                next();
            }
        })
    } else {

        // if no token then return an error
        return res.status(403).send({
            success: false,
            message: 'no token provided.'
        })
    }
}

module.exports = router;