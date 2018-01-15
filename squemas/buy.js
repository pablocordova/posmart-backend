const mongoose = require('mongoose');

const buySquema = mongoose.Schema({
  id: { type: String },
  date: { type: Date },
  company: { type: String },
  total: { type: Number },
  credits: [
    {
      date: { type: Date, required: true },
      amount: { type: Number, required: true }
    }
  ],
  products: [
    {
      quantity: { type: Number },
      measure: { type: String },
      description: { type: String },
      total: { type: Number },
      itemsPricesChosen: { type: Number },
      idProductChosen: { type: String }
    }
  ],
  state: { type: String, required: true }
}, { usePushEach: true });

module.exports = buySquema;