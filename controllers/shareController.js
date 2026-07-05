const User = require('../models/User');

exports.getSharedResult = async (req, res) => {
  try {
    const { id } = req.params;

    // Search for a user with the matching subdocument ID in stats
    const user = await User.findOne(
      { 'stats._id': id },
      { username: 1, 'stats.$': 1 }
    );

    if (!user || !user.stats || user.stats.length === 0) {
      return res.status(404).json({ message: 'Shared result not found' });
    }

    const stat = user.stats[0];
    res.json({
      username: user.username,
      wpm: stat.wpm,
      accuracy: stat.accuracy,
      errors: stat.errors,
      mode: stat.mode,
      category: stat.category || 'English',
      difficulty: stat.difficulty || 'Medium',
      language: stat.language || 'English',
      duration: stat.duration,
      date: stat.date
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
