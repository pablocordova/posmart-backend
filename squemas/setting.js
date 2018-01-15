const mongoose = require('mongoose');

const setting_squema = mongoose.Schema({
  refreshTokenGoogle: { type: String },
  tokenGoogle: { type: String },
  expirationTokenGoogle: { type: Date },
  printerId: { type: String, default: '' },
  ticketSetting: {
    title: { type: String, default: '' },
    head1Line: { type: String, default: '' },
    head2Line: { type: String, default: '' },
    Foot1Line: { type: String, default: '' },
    Foot2Line: { type: String, default: '' }
  }
}, { usePushEach: true });

module.exports = setting_squema;