const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const statSchema = new mongoose.Schema({
  wpm: Number,
  accuracy: Number,
  errors: Number,
  mode: { type: String, enum: ['practice', 'test'], default: 'test' },
  duration: Number, // seconds
  date: { type: Date, default: Date.now },
});

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
    streak: { type: Number, default: 0 },
    lastPracticeDate: { type: Date },
    level: { type: String, enum: ['beginner', 'intermediate', 'pro'], default: null },
    theme: {
      background: { type: String, default: '#0f0f0f' },
      text: { type: String, default: '#e2e8f0' },
      accent: { type: String, default: '#6366f1' },
      mode: { type: String, default: 'dark' },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
