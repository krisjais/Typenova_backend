const CustomText = require('../models/CustomText');

exports.createCustomText = async (req, res) => {
  try {
    const { title, content, difficulty, language } = req.body;
    if (!title || !content || !difficulty) {
      return res.status(400).json({ message: 'Title, content, and difficulty are required' });
    }
    if (content.length > 5000) {
      return res.status(400).json({ message: 'Content exceeds 5000 character limit' });
    }

    const words = content.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const specialCharCount = content.replace(/[a-zA-Z0-9\s]/g, '').length;
    const totalCharCountNoSpaces = content.replace(/\s+/g, '').length;
    const avgWordLength = wordCount > 0 ? parseFloat((totalCharCountNoSpaces / wordCount).toFixed(1)) : 0;

    const newText = await CustomText.create({
      title,
      content,
      difficulty,
      language: language || 'English',
      wordCount,
      avgWordLength,
      specialCharCount,
      user: req.userId
    });

    res.status(201).json(newText);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCustomTexts = async (req, res) => {
  try {
    const texts = await CustomText.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(texts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCustomText = async (req, res) => {
  try {
    const text = await CustomText.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!text) {
      return res.status(404).json({ message: 'Custom text not found' });
    }
    res.json({ message: 'Custom text deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
