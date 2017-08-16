function loggedOut(req, res, next){
    console.log("Hitting the loggedout middleware");
    if (req.session && req.session.userId){
        return res.redirect('/v2/about');
    }
    return next();
}

function requiresLogin (req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        let err = new Error('You must be logged in to view this page.');
        err.status = 401;
        return next(err);
    }
}

module.exports.loggedOut = loggedOut;
module.exports.requiresLogin = requiresLogin;