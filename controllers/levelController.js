const User = require('../models/User');

exports.setLevel = async (req, res) => {
  try {
    const { level } = req.body;
    if (!['beginner', 'intermediate', 'pro'].includes(level))
      return res.status(400).json({ message: 'Invalid level' });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { level },
      { new: true }
    ).select('level username');

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLevel = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('level');
    res.json({ level: user?.level || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
