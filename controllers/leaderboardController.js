const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ bestWpm: { $gt: 0 } })
      .select('username bestWpm streak')
      .sort({ bestWpm: -1 })
      .limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
