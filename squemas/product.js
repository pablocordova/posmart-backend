const mongoose = require('mongoose');
const config = require('../config/products');

var products_schema = mongoose.Schema({
  category: { type: String, enum: config.CATEGORIES, required: true },
  minimumUnit: { type: String, enum: config.MINIMUM_PACKAGES, required: true },
  name: { type: String, unique: true, required: true },
  picture: { type: String },
  quantity: { type: Number, default: 0 },
  unitCost: { type: Number, default: 0 },
  prices: [
    {
      quantity: { type: String },
      name: { type: String },
      items: { type: Number },
      price: { type: Number }
    }
  ]
}, { usePushEach: true });

module.exports = products_schema;