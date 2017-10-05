var mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Cost of processing the data in bcrypt - salt
const saltRounds = 10;

var user_schema = new mongoose.Schema({
  firstname: { type: String },
  lastname: { type: String },
  username: { type: String },
  password: { type: String }
});

// Use bcrypt middleware to encryp password, salt is auto-gen
user_schema.pre('save', function(next){
  let user = this;
  bcrypt.hash(user.password, saltRounds, function(err, hash) {
    if (err) return next();
    user.password = hash;
    next();
  });
});

var user = mongoose.model('User', user_schema);

module.exports = user;
