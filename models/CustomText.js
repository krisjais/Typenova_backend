const mongoose = require('mongoose');

const customTextSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, maxlength: 5000 },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  category: { type: String, default: 'Custom' },
  language: { type: String, default: 'English' },
  wordCount: { type: Number },
  avgWordLength: { type: Number },
  specialCharCount: { type: Number },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('CustomText', customTextSchema);
