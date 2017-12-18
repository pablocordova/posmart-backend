const mongoose = require('mongoose');

const customer_squema = mongoose.Schema({
  firstname: { type: String, required: true, unique: true },
  lastname: { type: String },
  dni: { type: String },
  phone: { type: String },
  address: { type: String }
}, { usePushEach: true });

module.exports = customer_squema;