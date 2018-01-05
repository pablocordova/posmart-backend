const mongoose = require('mongoose');

var sales_schema = mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  credits: [
    {
      date: { type: Date, required: true },
      amount: { type: Number, required: true }
    }
  ],
  date: { type: Date, required: true },
  igv: { type: Number, required: true },
  products: [
    {
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      unitsInPrice: { type: Number, required: true },
      total: { type: Number, required: true },
      earning: { type: Number, required: true }
    }
  ],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  state: { type: String, required: true }
}, { usePushEach: true });

module.exports = sales_schema;