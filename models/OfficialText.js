const mongoose = require('mongoose');

const officialTextSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  category: { type: String, required: true },
  language: { type: String, default: 'English' },
  wordCount: { type: Number },
  avgWordLength: { type: Number },
  specialCharCount: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('OfficialText', officialTextSchema);
