const mongoose = require('mongoose');
const config = require('../config/products');

var products_schema = mongoose.Schema({
  category: { type: String, enum: config.CATEGORIES, required: true },
  minimumUnit: { type: String, enum: config.MINIMUM_PACKAGES, required: true },
  name: { type: String, unique: true, required: true },
  picture: { type: String },
  quantity: { type: Number },
  unitCost: { type: Number }
});

const product = mongoose.model('Product', products_schema);

module.exports = product;