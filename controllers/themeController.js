const User = require('../models/User');

exports.saveTheme = async (req, res) => {
  try {
    const { background, text, accent, mode } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { theme: { background, text, accent, mode } },
      { new: true }
    ).select('theme');
    res.json(user.theme);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTheme = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('theme');
    res.json(user?.theme || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
