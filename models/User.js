const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const statSchema = new mongoose.Schema({
  wpm: Number,
  accuracy: Number,
  errors: Number,
  duration: Number, // seconds
  category: { type: String, enum: ['COMPETITIVE', 'PRACTICE'], default: 'COMPETITIVE' },
  subtype: { type: String, required: true },
  textId: { type: String },
  consistency: { type: Number },
  isFlagged: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  legacy: { type: Boolean, default: false },
  season: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
}, { suppressReservedKeysWarning: true });

const weakKeySchema = new mongoose.Schema({
  key: String,
  errorCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
});

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    stats: [statSchema],
    weakKeys: [weakKeySchema],
    bestWpm: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastPracticeDate: { type: Date },
    level: { type: String, enum: ['beginner', 'intermediate', 'pro'], default: null },
    language: { type: String, enum: ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese'], default: 'English' },
    theme: {
      background: { type: String, default: '#0f0f0f' },
      text: { type: String, default: '#e2e8f0' },
      accent: { type: String, default: '#6366f1' },
      mode: { type: String, default: 'dark' },
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    raceWins: { type: Number, default: 0 },
    raceLosses: { type: Number, default: 0 },
    achievements: [
      {
        name: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
        legacy: { type: Boolean, default: false }
      }
    ],
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
