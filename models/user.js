const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Cost of processing the data in bcrypt - salt
const saltRounds = 10;

var user_schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: true, required: true },
  password: { type: String, required: true },
  permissions: {
    customers: { type: Boolean, default: false, required: true },
    products: { type: Boolean, default: false, required: true },
    sales: { type: Boolean, default: false, required: true },
    settings: { type: Boolean, default: false, required: true },
    users: { type: Boolean, default: false, required: true }
  },
  type: { type: String, required: true }
});

// Use bcrypt middleware to encryp password, salt is auto-gen
user_schema.pre('save', function(next) {
  let user = this;
  bcrypt.hash(user.password, saltRounds, (err, hash) => {
    if (err) return next();
    user.password = hash;
    next();
  });
});

const user = mongoose.model('User', user_schema);

module.exports = user;
