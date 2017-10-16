const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Cost of processing the data in bcrypt - salt
const saltRounds = 10;

var user_schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  permissions: {
    customers: { type: Boolean, default: false },
    products: { type: Boolean, default: false },
    sales: { type: Boolean, default: false },
    settings: { type: Boolean, default: false },
    users: { type: Boolean, default: false }
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
