const mongoose = require('mongoose');

const pendingSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: String }, // references OfficialText _id or CustomText _id or null
  textHash: { type: String, required: true },
  subtype: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED'], default: 'PENDING' },
  matchId: { type: String }, // reserved for future multiplayer race groups
  createdAt: { type: Date, default: Date.now, expires: 600 } // automatic expiration after 10 minutes
});

module.exports = mongoose.model('PendingSession', pendingSessionSchema);
