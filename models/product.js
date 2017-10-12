const mongoose = require('mongoose');
const config = require('../config/products');

var products_schema = mongoose.Schema({
  quantity: { type: Number },
  minimumUnit: { type: String, enum: config.MINIMUM_PACKAGES, required: true },
  category: { type: String, enum: config.CATEGORIES, required: true },
  unitCost: { type: Number },
  picture: { type: String }
});

const product = mongoose.model('Product', products_schema);

module.exports = product;