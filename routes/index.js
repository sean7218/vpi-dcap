

let express = require('express');
let router = express.Router();

router.get('/', function(req, res, next){
    return res.render('index', { title: "Home Page"})

});


router.get('/about', function(req, res, next){
    return res.render('about', { title: "about Page"})

});


router.get('/contact', function(req, res, next){
    return res.render('contact', { title: "contact Page"})

});



module.exports = router;