const mongoose = require('mongoose');

const setting_squema = mongoose.Schema({
  refreshTokenGoogle: { type: String },
  tokenGoogle: { type: String },
  expirationTokenGoogle: { type: Date },
  printerId: { type: String },
  ticketSetting: {
    title: { type: String },
    head1Line: { type: String },
    head2Line: { type: String },
    Foot1Line: { type: String },
    Foot2Line: { type: String }
  }
}, { usePushEach: true });

module.exports = setting_squema;