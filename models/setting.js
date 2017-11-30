const mongoose = require('mongoose');

const setting_squema = mongoose.Schema({
  refreshTokenGoogle: { type: String },
  tokenGoogle: { type: String },
  expirationTokenGoogle: { type: Date }
});

const setting = mongoose.model('Setting', setting_squema);

module.exports = setting;