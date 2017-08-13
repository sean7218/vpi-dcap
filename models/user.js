"user strict";
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        trim: true
    },
    favoriteBook: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
});

// authenticate input against database documents
UserSchema.statics.authenticate = function(email, password, callback) {
    console.log("Starting authentication");
    console.log(email);
    console.log(password);
    User.findOne({email: email})
        .exec(function(err, user){
            if (err) {
                console.log(err);
                return callback(err);
            } else if (!user) {
                console.log("user Can't be find");
                let err = new Error("User not found");
                err.status = 401;
                return callback(err);
            }
            console.log("user was found and no error from the database side");
            console.log(user.email);
            console.log(user.favoriteBook);
            console.log(user.password);

            bcrypt.compare(password, user.password, function(err, result){

               if (result === true){
                   console.log("password compared is true");
                    return callback(null, user);
               } else {
                   let err = new Error("Password is not validated!");
                   err.status = 401;

                   console.log("Password compared is false");
                   return callback(err);
               }

            });
        });

};

// Hash password before saving to database
UserSchema.pre('save', function(next){
    let user = this;
    bcrypt.hash(user.password, 10, function(err, hash){
        if (err) {
            return next(err);
        } else {
            user.password = hash;
            next();
        }

    });

});

const User = mongoose.model('User', UserSchema);
module.exports = User;




