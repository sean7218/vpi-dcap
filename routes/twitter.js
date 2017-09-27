"use strict";

let express = require("express");
let router = express.Router();


router.route("/login").get(function(req, res, next){
    res.send("This is twitter login")
})

module.exports = router;

