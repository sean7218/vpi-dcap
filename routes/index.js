

let express = require('express');
let router = express.Router();
let User = require('../models/user');
let mid = require('../middleware/index');

router.route('/').get(function(req, res, next){
    return res.render('index', { title: "Home Page"});

});

router.route('/about').get(mid.requiresLogin, function(req, res, next){
    return res.render('about', { title: "Aobut Page" });

});

router.route('/contact').get(function(req, res, next){
    return res.render('contact', { title: "Conact Page"});
});

router.route('/register').get(mid.loggedOut, function(req, res, next){
    res.render('register', {title: 'Sign up'});
});

router.route('/register').post(function(req, res, next){
    if (req.body.email &&
        req.body.username &&
        req.body.password &&
        req.body.favoriteBook &&
        req.body.confirmPassword) {

        // Confirm user typed in the same password
        if (req.body.password !== req.body.confirmPassword) {
            let err = new Error("Passwords do not match");
            err.status = 400;
            return next(err);
        }

        // create an object with input
        let userData = {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
            favoriteBook: req.body.favoriteBook
        };

        // use schema's 'create' method to insert an document into Mongo
        User.create(userData, function(err, data){
            if (err){
                return next(err);
            } else {
                req.session.userId = data._id;
                return res.render('profile', {name: data.username, favorite: data.favoriteBook})
            }
        });
    } else {
        let err = new Error("All fields required.");
        err.status = 400;
        return next(err);
    }
});

router.route('/login').get(function(req, res, next){
    return res.render('login', { title: 'login page'});
});

router.route('/login').post(function(req, res, next){

    if (req.body.email && req.body.password) {
        User.authenticate(req.body.email, req.body.password, function(err, user){

            if (err || !user) {
                //return res.json({status: "err or no user",err: err, user: user});
                let err = new Error("Wrong Email or Password");
                err.status = 401;
                return next(err);
            } else {
                //return res.json({status: "successfully login", id: user._id});
                //console.log("Session creation");
                //console.log(user._id);
                req.session.userId = user._id;

                return res.redirect('/v2/profile');
            }
        });
    } else {
        let err = new Error("Email and Password field can't be empty");
        err.status = 401;
        return next(err);
    }
});

router.route('/logout').get(function(req, res, next){
    if(req.session){
        req.session.destroy(function(err){
            if(err){
                return next(err);
            } else {
                console.log("Session Destroyed");
                return res.redirect('/v2/');
            }
        });
    }
});

router.route('/profile').get(mid.requiresLogin, function (req, res, next) {

    User.findById(req.session.userId)
        .exec(function(err, user){
            if (err) {
                console.log("error was found when findbyID");
                return next(err);
            } else {
                console.log("successfully found the userbyID");
                return res.render('profile', {title: "Profile",name: user.username, favorite: user.favoriteBook});
            }
        })
        .then(function(resolve, reject){
            console.log("Resolve: " + resolve);
            console.log("Reject: " + reject);
        });
});

module.exports = router;