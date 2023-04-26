const User = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

module.exports = function (passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {

            User.findOne({ email: email })
                .then(user => {
                    if (!user) {
                        return done(null, false, { message: 'email not registered' });
                    }

                    bcrypt.compare(password, user.password)
                        .then(isMatch => {
                            if (isMatch) {
                                return done(null, user);
                            } else {
                                return done(null, false, { message: 'password incorrect' });
                            }
                        })
                        .catch(err => {
                            throw err;
                        });
                })
                .catch(err => {
                    console.log(err);
                    return done(err);
                });
        })
    );

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id)
            .then(user => {
                done(null, user);
            })
            .catch(err => {
                console.log(err);
                return done(err);
            });
    });
};