const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const localStrategy = require('passport-local').Strategy;
const passport = require('passport');
const router = express.Router();

const secret = 'mykeysecret';
const User = require('../models/user');

passport.use(new localStrategy({ usernameField: 'email' }, function(email, password, done) {

  User.findOne( { email: email }, (err, user) => {

    if (err) throw err;
    if (!user) return done(null, false);

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) throw err;
      if (!isMatch) return done(null, false);
      return done(null, user);
    });
  });
}));

// Methods necessary for passport middleware

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/', passport.authenticate('local'), (req, res) => {
  const payload = { id:  req.user._id };
  const token = jwt.sign(payload, secret);
  return res.status(200).send({
    token: token,
    username: req.user.username,
    email: req.user.email,
    type: req.user.type
  });
});

module.exports = router;