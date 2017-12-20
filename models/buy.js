const mongoose = require('mongoose');

const buy_squema = mongoose.Schema({
  id: { type: String },
  date: { type: Date },
  company: { type: String },
  total: { type: Number },
  products: [
    {
      quantity: { type: Number },
      measure: { type: String },
      description: { type: String },
      total: { type: Number },
      itemsPricesChosen: { type: Number },
      idProductChosen: { type: String }
    }
  ]
}, { usePushEach: true });

module.exports = buy_squema;