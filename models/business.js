const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Cost of processing the data in bcrypt - salt
const saltRounds = 10;

var business_schema = new mongoose.Schema({
  business: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  database: { type: String, required: true, unique: true }
}, { usePushEach: true });

// Use bcrypt middleware to encryp password, salt is auto-gen
business_schema.pre('save', function(next) {
  let business = this;
  bcrypt.hash(business.password, saltRounds, (err, hash) => {
    if (err) return next();
    business.password = hash;
    next();
  });
});

module.exports = business_schema;
