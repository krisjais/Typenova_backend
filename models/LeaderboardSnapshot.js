const mongoose = require('mongoose');

const leaderboardSnapshotSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['global', 'practice', 'zombie-escape', 'nova-racer', 'type-racer', 'rocket-rush'],
    required: true
  },
  timeFilter: {
    type: String,
    enum: ['all', 'monthly', 'weekly', 'daily'],
    required: true
  },
  standings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: String,
      bestWpm: Number,
      streak: Number,
      accuracy: Number,
      totalTests: Number
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

// Compound index to ensure uniqueness of each type + timeFilter cache
leaderboardSnapshotSchema.index({ type: 1, timeFilter: 1 }, { unique: true });

module.exports = mongoose.model('LeaderboardSnapshot', leaderboardSnapshotSchema);
