const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Cost of processing the data in bcrypt - salt
const saltRounds = 10;

var userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  permissionDiscount: { type: String, required: true }
}, { usePushEach: true });

// Use bcrypt middleware to encryp password, salt is auto-gen
userSchema.pre('save', function(next) {
  let user = this;
  bcrypt.hash(user.password, saltRounds, (err, hash) => {
    if (err) return next();
    user.password = hash;
    next();
  });
});

module.exports = userSchema;
