const User = require('../models/User');

exports.saveLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    if (!['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese'].includes(language)) {
      return res.status(400).json({ message: 'Invalid language' });
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { language },
      { new: true }
    ).select('language');
    res.json({ language: user.language });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLanguage = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('language');
    res.json({ language: user?.language || 'English' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
