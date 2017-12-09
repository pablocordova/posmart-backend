const mongoose = require('mongoose');

const customer_squema = mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String },
  dni: { type: String, unique: true, required: true },
  phone: { type: String },
  address: { type: String }
}, { usePushEach: true });

const customer = mongoose.model('Customer', customer_squema);

module.exports = customer;