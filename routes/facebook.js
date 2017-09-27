"use strict";

let express = require('express');
let router = express.Router();
let jwt = require('jsonwebtoken');

var token = jwt.sign({
    "name": "sean7218",
    "email":"sean7218@gmail.com"
  },
  "superSecret",
  {
    expiresIn: 60*60 // expires in 24 hours
  })

router.route("/login").get(function(req, res, next){
    res.json({
        success: true,
        message: "Enjoy your token",
        token: token
    })
})

router.route("/data").get(verify, function(req,res,next){
    res.send("Yes I have got the data")
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

//router.use(verify);

module.exports = router;