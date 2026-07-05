const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  type: {
    type: String,
    enum: ['test_completed', 'achievement_unlocked', 'race_won', 'friend_added'],
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
