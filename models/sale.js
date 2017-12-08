const mongoose = require('mongoose');

var sales_schema = mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  date: { type: Date, required: true },
  igv: { type: Number, required: true },
  products: [
    {
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      price: { type: Number, required: true },
      unitsInPrice: { type: Number, required: true },
      total: { type: Number, required: true }
    }
  ],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true }
});

const sale = mongoose.model('Sale', sales_schema);

module.exports = sale;